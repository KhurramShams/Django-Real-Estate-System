from decimal import Decimal
from django.db import models
from django.db.models import Count, Sum, Q, F, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.accounts.models import UserRole
from apps.properties.models import Property, PropertyStatus
from apps.clients.models import Client
from apps.deals.models import Deal, DealStatus
from apps.payments.models import Payment


class DashboardSummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/
    Aggregates performance metrics, property inventory status, deals pipeline,
    and urgent collections in a single high-performance query.
    Role-aware:
    - Agents receive metrics scoped to their own assigned portfolio.
    - Admins, Accountants, and Staff receive agency-wide aggregated metrics.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        today = timezone.localdate()
        start_of_month = today.replace(day=1)
        if start_of_month.month == 12:
            start_of_next_month = start_of_month.replace(
                year=start_of_month.year + 1, month=1
            )
        else:
            start_of_next_month = start_of_month.replace(
                month=start_of_month.month + 1
            )

        month_label = start_of_month.strftime("%B %Y")

        # Determine Role Scoping
        is_agent = user.role == UserRole.AGENT and not (
            user.is_staff or user.is_superuser
        )
        scope = "agent" if is_agent else "agency"

        # Base querysets with scoping
        prop_qs = Property.objects.all()
        deal_qs = Deal.objects.filter(agent=user) if is_agent else Deal.objects.all()
        client_qs = (
            Client.objects.filter(assigned_agent=user)
            if is_agent
            else Client.objects.all()
        )
        payment_qs = (
            Payment.objects.filter(deal__agent=user)
            if is_agent
            else Payment.objects.all()
        )

        # 1. Properties Aggregation
        prop_aggs = prop_qs.aggregate(
            total=Count("id"),
            available=Count("id", filter=Q(status=PropertyStatus.AVAILABLE)),
            under_negotiation=Count(
                "id", filter=Q(status=PropertyStatus.UNDER_NEGOTIATION)
            ),
            sold=Count("id", filter=Q(status=PropertyStatus.SOLD)),
            rented=Count("id", filter=Q(status=PropertyStatus.RENTED)),
            off_market=Count("id", filter=Q(status=PropertyStatus.OFF_MARKET)),
        )

        # 2. Deals Aggregation
        deal_aggs = deal_qs.aggregate(
            total_deals=Count("id"),
            active_deals=Count(
                "id",
                filter=Q(
                    deal_status__in=[
                        DealStatus.NEGOTIATION,
                        DealStatus.BOOKED,
                        DealStatus.IN_PROGRESS,
                    ]
                ),
            ),
            completed_this_month=Count(
                "id",
                filter=Q(
                    deal_status=DealStatus.COMPLETED,
                    deal_date__gte=start_of_month,
                    deal_date__lt=start_of_next_month,
                ),
            ),
            revenue_this_month=Sum(
                "agreed_price",
                filter=Q(
                    deal_status=DealStatus.COMPLETED,
                    deal_date__gte=start_of_month,
                    deal_date__lt=start_of_next_month,
                ),
            ),
            commission_this_month=Sum(
                "commission_amount",
                filter=Q(
                    deal_status=DealStatus.COMPLETED,
                    deal_date__gte=start_of_month,
                    deal_date__lt=start_of_next_month,
                ),
            ),
        )

        # 3. Payments & Collections Aggregation
        payment_aggs = payment_qs.aggregate(
            pending_count=Count(
                "id",
                filter=Q(amount_paid__lt=F("amount")),
            ),
            pending_amount=Sum(
                F("amount") - Coalesce(F("amount_paid"), Value(Decimal("0.00"))),
                filter=Q(amount_paid__lt=F("amount")),
                output_field=models.DecimalField(
                    max_digits=14, decimal_places=2
                ),
            ),
            overdue_count=Count(
                "id",
                filter=Q(due_date__lt=today, amount_paid__lt=F("amount")),
            ),
            overdue_amount=Sum(
                F("amount") - Coalesce(F("amount_paid"), Value(Decimal("0.00"))),
                filter=Q(due_date__lt=today, amount_paid__lt=F("amount")),
                output_field=models.DecimalField(
                    max_digits=14, decimal_places=2
                ),
            ),
            collected_this_month=Sum(
                "amount_paid",
                filter=Q(
                    paid_date__gte=start_of_month,
                    paid_date__lt=start_of_next_month,
                ),
            ),
        )

        # 4. Clients Aggregation
        clients_count = client_qs.count()

        return Response(
            {
                "scope": scope,
                "user": {
                    "id": str(user.id),
                    "full_name": user.get_full_name(),
                    "role": user.role,
                },
                "month_label": month_label,
                "properties": {
                    "total": prop_aggs["total"] or 0,
                    "available": prop_aggs["available"] or 0,
                    "under_negotiation": prop_aggs["under_negotiation"] or 0,
                    "sold": prop_aggs["sold"] or 0,
                    "rented": prop_aggs["rented"] or 0,
                    "off_market": prop_aggs["off_market"] or 0,
                },
                "deals": {
                    "total": deal_aggs["total_deals"] or 0,
                    "active": deal_aggs["active_deals"] or 0,
                    "completed_this_month": deal_aggs["completed_this_month"]
                    or 0,
                    "revenue_this_month": str(
                        deal_aggs["revenue_this_month"] or Decimal("0.00")
                    ),
                    "commission_this_month": str(
                        deal_aggs["commission_this_month"] or Decimal("0.00")
                    ),
                },
                "payments": {
                    "pending_count": payment_aggs["pending_count"] or 0,
                    "pending_amount": str(
                        payment_aggs["pending_amount"] or Decimal("0.00")
                    ),
                    "overdue_count": payment_aggs["overdue_count"] or 0,
                    "overdue_amount": str(
                        payment_aggs["overdue_amount"] or Decimal("0.00")
                    ),
                    "collected_this_month": str(
                        payment_aggs["collected_this_month"] or Decimal("0.00")
                    ),
                },
                "clients": {
                    "total_active": clients_count,
                },
            },
            status=status.HTTP_200_OK,
        )
