from django_filters import rest_framework as filters
from .models import Deal, DealStatus, DealType, CommissionStatus


class DealFilter(filters.FilterSet):
    """
    FilterSet for Deals module supporting deal status, transaction type,
    agent, property, client, commission status, price ranges, and dates.
    """

    deal_status = filters.ChoiceFilter(choices=DealStatus.choices)
    deal_type = filters.ChoiceFilter(choices=DealType.choices)
    commission_status = filters.ChoiceFilter(choices=CommissionStatus.choices)

    agent = filters.UUIDFilter(field_name="agent__id")
    property = filters.UUIDFilter(field_name="property__id")
    client = filters.UUIDFilter(field_name="client__id")

    min_price = filters.NumberFilter(field_name="agreed_price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="agreed_price", lookup_expr="lte")

    deal_date_after = filters.DateFilter(field_name="deal_date", lookup_expr="gte")
    deal_date_before = filters.DateFilter(field_name="deal_date", lookup_expr="lte")
    is_installment = filters.BooleanFilter(field_name="is_installment")

    class Meta:
        model = Deal
        fields = [
            "deal_status",
            "deal_type",
            "commission_status",
            "agent",
            "property",
            "client",
            "min_price",
            "max_price",
            "deal_date_after",
            "deal_date_before",
            "is_installment",
        ]
