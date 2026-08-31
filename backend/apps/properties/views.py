import time
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.common.services.storage import get_storage_service
from .models import Property, PropertyImage, Amenity
from .permissions import IsAdminOrAgentOrReadOnly
from .filters import PropertyFilter
from .serializers import (
    AmenitySerializer,
    PropertyImageSerializer,
    PropertyImageUploadSerializer,
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateUpdateSerializer,
)


class AmenityViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Amenity lookup items.
    """

    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAdminOrAgentOrReadOnly]
    search_fields = ["name", "description"]
    ordering = ["name"]


class PropertyViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for Property listings with advanced filtering, search, and image upload.
    """

    queryset = Property.objects.all().prefetch_related("images", "amenities")
    permission_classes = [IsAdminOrAgentOrReadOnly]
    filterset_class = PropertyFilter
    search_fields = [
        "title",
        "description",
        "address",
        "locality",
        "city",
        "owner_name",
        "owner_contact",
    ]
    ordering_fields = ["price", "size", "created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        elif self.action == "retrieve":
            return PropertyDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return PropertyCreateUpdateSerializer
        return PropertyDetailSerializer

    @action(
        detail=True,
        methods=["post"],
        url_path="upload-image",
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[IsAdminOrAgentOrReadOnly],
    )
    def upload_image(self, request, pk=None):
        """
        Uploads a property image to Supabase Storage and attaches a PropertyImage record.
        POST /api/v1/properties/<id>/upload-image/
        """
        property_obj = self.get_object()
        serializer = PropertyImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["image"]
        caption = serializer.validated_data.get("caption", "")
        is_primary = serializer.validated_data.get("is_primary", False)
        display_order = serializer.validated_data.get("display_order", 0)

        # Generate unique storage path
        file_ext = uploaded_file.name.split(".")[-1] if "." in uploaded_file.name else "jpg"
        timestamp = int(time.time())
        storage_path = f"properties/{property_obj.id}/{timestamp}_{uploaded_file.name}"

        storage_service = get_storage_service()
        upload_result = storage_service.upload_file(
            file_path=storage_path,
            file_content=uploaded_file,
            content_type=uploaded_file.content_type,
        )

        image_url = upload_result.get("url") or storage_service.get_public_url(storage_path)

        # If this is the property's first image, make it primary automatically
        if not is_primary and not property_obj.images.exists():
            is_primary = True

        image_record = PropertyImage.objects.create(
            property=property_obj,
            image_url=image_url,
            storage_path=storage_path,
            caption=caption,
            is_primary=is_primary,
            display_order=display_order,
        )

        return Response(
            PropertyImageSerializer(image_record).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"delete-image/(?P<image_id>[^/.]+)",
        permission_classes=[IsAdminOrAgentOrReadOnly],
    )
    def delete_image(self, request, pk=None, image_id=None):
        """
        Deletes a property image from DB and Supabase Storage.
        DELETE /api/v1/properties/<id>/delete-image/<image_id>/
        """
        property_obj = self.get_object()
        try:
            image_record = property_obj.images.get(id=image_id)
        except PropertyImage.DoesNotExist:
            return Response(
                {"error": "Image not found for this property."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if image_record.storage_path:
            storage_service = get_storage_service()
            try:
                storage_service.delete_file(image_record.storage_path)
            except Exception:
                pass

        was_primary = image_record.is_primary
        image_record.delete()

        # If primary was deleted, promote another image to primary
        if was_primary:
            next_image = property_obj.images.first()
            if next_image:
                next_image.is_primary = True
                next_image.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path=r"set-primary-image/(?P<image_id>[^/.]+)",
        permission_classes=[IsAdminOrAgentOrReadOnly],
    )
    def set_primary_image(self, request, pk=None, image_id=None):
        """
        Sets the designated image as primary and unsets all other images.
        POST /api/v1/properties/<id>/set-primary-image/<image_id>/
        """
        property_obj = self.get_object()
        try:
            target_image = property_obj.images.get(id=image_id)
        except PropertyImage.DoesNotExist:
            return Response(
                {"error": "Image not found for this property."},
                status=status.HTTP_404_NOT_FOUND,
            )

        property_obj.images.exclude(id=image_id).update(is_primary=False)
        target_image.is_primary = True
        target_image.save()

        return Response(
            PropertyImageSerializer(target_image).data,
            status=status.HTTP_200_OK,
        )
