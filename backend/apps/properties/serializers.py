from rest_framework import serializers
from .models import Property, PropertyImage, Amenity


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name", "icon", "description"]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = [
            "id",
            "image_url",
            "storage_path",
            "caption",
            "is_primary",
            "display_order",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PropertyImageUploadSerializer(serializers.Serializer):
    """
    Serializer for uploading an image file to a property via Supabase Storage.
    """

    image = serializers.FileField(
        required=True,
        help_text="Binary image file (JPEG, PNG, WEBP)",
    )
    caption = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default="",
    )
    is_primary = serializers.BooleanField(
        required=False,
        default=False,
    )
    display_order = serializers.IntegerField(
        required=False,
        default=0,
    )

    def validate_image(self, value):
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
        content_type = getattr(value, "content_type", "")
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Unsupported image type: {content_type}. Allowed types: JPEG, PNG, WEBP."
            )
        # Max file size 10 MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file size must not exceed 10 MB.")
        return value


class PropertyListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for list endpoints.
    """

    primary_image_url = serializers.ReadOnlyField()
    property_type_display = serializers.CharField(
        source="get_property_type_display", read_only=True
    )
    listing_type_display = serializers.CharField(
        source="get_listing_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    size_unit_display = serializers.CharField(
        source="get_size_unit_display", read_only=True
    )
    amenities = AmenitySerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "property_type",
            "property_type_display",
            "listing_type",
            "listing_type_display",
            "status",
            "status_display",
            "city",
            "locality",
            "address",
            "size",
            "size_unit",
            "size_unit_display",
            "price",
            "primary_image_url",
            "amenities",
            "created_at",
            "updated_at",
        ]


class PropertyDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer including full image gallery and owner contact information.
    """

    images = PropertyImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    primary_image_url = serializers.ReadOnlyField()
    property_type_display = serializers.CharField(
        source="get_property_type_display", read_only=True
    )
    listing_type_display = serializers.CharField(
        source="get_listing_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    size_unit_display = serializers.CharField(
        source="get_size_unit_display", read_only=True
    )

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "description",
            "property_type",
            "property_type_display",
            "listing_type",
            "listing_type_display",
            "status",
            "status_display",
            "address",
            "city",
            "locality",
            "postal_code",
            "latitude",
            "longitude",
            "size",
            "size_unit",
            "size_unit_display",
            "price",
            "owner_name",
            "owner_contact",
            "owner_email",
            "primary_image_url",
            "images",
            "amenities",
            "created_at",
            "updated_at",
        ]


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Property records.
    """

    amenity_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Amenity.objects.all(),
        source="amenities",
        required=False,
        write_only=True,
    )

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "description",
            "property_type",
            "listing_type",
            "status",
            "address",
            "city",
            "locality",
            "postal_code",
            "latitude",
            "longitude",
            "size",
            "size_unit",
            "price",
            "owner_name",
            "owner_contact",
            "owner_email",
            "amenity_ids",
        ]
        read_only_fields = ["id"]
