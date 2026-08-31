from django.db import models
from django.utils import timezone
from django_filters import rest_framework as filters
from .models import Payment, PaymentStatus, PaymentMethod


class PaymentFilter(filters.FilterSet):
    """
    FilterSet for Payments supporting deal, payment status, payment method,
    due/paid date ranges, computed overdue status, and granular effective_status.
    """

    deal = filters.UUIDFilter(field_name="deal__id")
    payment_status = filters.ChoiceFilter(choices=PaymentStatus.choices)
    payment_method = filters.ChoiceFilter(choices=PaymentMethod.choices)

    due_date_after = filters.DateFilter(field_name="due_date", lookup_expr="gte")
    due_date_before = filters.DateFilter(field_name="due_date", lookup_expr="lte")
    paid_date_after = filters.DateFilter(field_name="paid_date", lookup_expr="gte")
    paid_date_before = filters.DateFilter(field_name="paid_date", lookup_expr="lte")

    overdue = filters.BooleanFilter(method="filter_overdue")
    effective_status = filters.CharFilter(method="filter_effective_status")

    class Meta:
        model = Payment
        fields = [
            "deal",
            "payment_status",
            "payment_method",
            "due_date_after",
            "due_date_before",
            "paid_date_after",
            "paid_date_before",
            "overdue",
            "effective_status",
        ]

    def filter_overdue(self, queryset, name, value):
        """
        Includes both 'overdue' (untouched) and 'partial_overdue' (partially paid) payments.
        """
        today = timezone.localdate()
        if value is True:
            return (
                queryset.filter(due_date__lt=today)
                .exclude(payment_status=PaymentStatus.PAID)
                .filter(
                    models.Q(amount_paid__lt=models.F("amount"))
                    | models.Q(amount_paid__isnull=True)
                )
            )
        elif value is False:
            return queryset.exclude(
                due_date__lt=today,
                payment_status__in=[PaymentStatus.PENDING, PaymentStatus.PARTIAL],
            )
        return queryset

    def filter_effective_status(self, queryset, name, value):
        today = timezone.localdate()
        val = value.lower().strip()
        if val == "paid":
            return queryset.filter(
                models.Q(amount_paid__gte=models.F("amount"), amount__gt=0)
                | models.Q(payment_status=PaymentStatus.PAID)
            )
        elif val == "partial_overdue":
            return queryset.filter(
                due_date__lt=today,
                amount_paid__gt=0,
                amount_paid__lt=models.F("amount"),
            )
        elif val == "overdue":
            return (
                queryset.filter(due_date__lt=today)
                .filter(models.Q(amount_paid__isnull=True) | models.Q(amount_paid=0))
                .exclude(payment_status=PaymentStatus.PAID)
            )
        elif val == "partial":
            return queryset.filter(
                due_date__gte=today,
                amount_paid__gt=0,
                amount_paid__lt=models.F("amount"),
            )
        elif val == "pending":
            return (
                queryset.filter(due_date__gte=today)
                .filter(models.Q(amount_paid__isnull=True) | models.Q(amount_paid=0))
                .exclude(payment_status=PaymentStatus.PAID)
            )
        return queryset
