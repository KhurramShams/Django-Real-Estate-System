from django_filters import rest_framework as filters
from .models import Client, ClientType, ClientSource
from apps.properties.models import PropertyType, ListingType


class ClientFilter(filters.FilterSet):
    """
    FilterSet for Clients module supporting client type, source, assigned agent,
    city/locality, property preferences, and budget ranges.
    """

    client_type = filters.ChoiceFilter(choices=ClientType.choices)
    source = filters.ChoiceFilter(choices=ClientSource.choices)
    assigned_agent = filters.UUIDFilter(field_name="assigned_agent__id")

    preferred_city = filters.CharFilter(field_name="preferred_city", lookup_expr="iexact")
    preferred_locality = filters.CharFilter(
        field_name="preferred_locality", lookup_expr="icontains"
    )
    preferred_property_type = filters.ChoiceFilter(choices=PropertyType.choices)
    preferred_listing_type = filters.ChoiceFilter(choices=ListingType.choices)

    min_budget = filters.NumberFilter(field_name="budget_min", lookup_expr="gte")
    max_budget = filters.NumberFilter(field_name="budget_max", lookup_expr="lte")

    class Meta:
        model = Client
        fields = [
            "client_type",
            "source",
            "assigned_agent",
            "preferred_city",
            "preferred_locality",
            "preferred_property_type",
            "preferred_listing_type",
            "min_budget",
            "max_budget",
        ]
