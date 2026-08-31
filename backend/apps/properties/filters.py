from django_filters import rest_framework as filters
from .models import Property, Amenity, PropertyStatus, PropertyType, ListingType


class PropertyFilter(filters.FilterSet):
    """
    FilterSet for Property model supporting price/size ranges, location, status, and amenities.
    """

    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    min_size = filters.NumberFilter(field_name="size", lookup_expr="gte")
    max_size = filters.NumberFilter(field_name="size", lookup_expr="lte")

    city = filters.CharFilter(field_name="city", lookup_expr="iexact")
    locality = filters.CharFilter(field_name="locality", lookup_expr="icontains")
    status = filters.ChoiceFilter(choices=PropertyStatus.choices)
    property_type = filters.ChoiceFilter(choices=PropertyType.choices)
    listing_type = filters.ChoiceFilter(choices=ListingType.choices)

    # Filter by amenities (UUID list or amenity names)
    amenities = filters.ModelMultipleChoiceFilter(
        queryset=Amenity.objects.all(),
        field_name="amenities__id",
        to_field_name="id",
    )

    class Meta:
        model = Property
        fields = [
            "status",
            "property_type",
            "listing_type",
            "city",
            "locality",
            "min_price",
            "max_price",
            "min_size",
            "max_size",
            "amenities",
        ]
