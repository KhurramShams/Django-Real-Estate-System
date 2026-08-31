from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import UserRole
from apps.payments.models import Payment
from apps.payments.serializers import PaymentListSerializer
from apps.payments.utils import generate_deal_installment_plan
from .models import Deal
from .permissions import DealPermission
from .filters import DealFilter
from .serializers import (
    DealListSerializer,
    DealDetailSerializer,
    DealCreateUpdateSerializer,
    AccountantDealCommissionSerializer,
)


class DealViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for Deals management.
    Enforces role-based queryset scoping:
    - Agents see only deals they manage.
    - Admins, Accountants, and Staff see all deals across the agency.
    - Accountants use a restricted serializer when updating commission settlement.
    """

    permission_classes = [DealPermission]
    filterset_class = DealFilter
    search_fields = [
        "property__title",
        "property__address",
        "property__locality",
        "property__city",
        "client__full_name",
        "client__phone_number",
        "client__email",
        "notes",
    ]
    ordering_fields = [
        "deal_date",
        "agreed_price",
        "commission_amount",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        queryset = Deal.objects.all().select_related("property", "client", "agent")

        if not user or not user.is_authenticated:
            return Deal.objects.none()

        # Agents are strictly scoped to their own deals
        if user.role == UserRole.AGENT and not (user.is_staff or user.is_superuser):
            return queryset.filter(agent=user)

        # Admins, Accountants, and Staff see all agency deals
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return DealListSerializer
        elif self.action == "retrieve":
            return DealDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            user = self.request.user
            if user and user.is_authenticated and user.role == UserRole.ACCOUNTANT:
                return AccountantDealCommissionSerializer
            return DealCreateUpdateSerializer
        return DealDetailSerializer

    @action(detail=True, methods=["post"], url_path="generate-installment-plan")
    def generate_installment_plan(self, request, pk=None):
        """
        Auto-generates a schedule of Payment installment records for an installment deal.
        """
        deal = self.get_object()
        user = request.user

        # Role verification for creation/generation
        if user.role == UserRole.STAFF:
            return Response(
                {"error": "Staff role does not have permission to generate installment plans."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not deal.is_installment:
            return Response(
                {
                    "error": "This deal is not configured as an installment deal (is_installment=False). Single payments should be created directly."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not deal.number_of_installments or deal.number_of_installments <= 0:
            return Response(
                {
                    "error": "Number of installments must be configured and greater than zero."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not deal.installment_frequency:
            return Response(
                {"error": "Installment frequency must be specified on the deal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        net_amount = deal.agreed_price - (deal.booking_amount or Decimal("0.00"))
        if net_amount <= 0:
            return Response(
                {
                    "error": "Agreed price must be greater than booking amount to generate an installment schedule."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_payments = deal.payments.all()
        if existing_payments.exists():
            force = str(request.data.get("force", "")).lower() in ["true", "1"]
            if not force:
                return Response(
                    {
                        "error": "Payments already exist for this deal. Pass 'force=true' as an Admin to regenerate the plan."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Regeneration requires ADMIN role
            if user.role != UserRole.ADMIN and not user.is_superuser:
                return Response(
                    {
                        "error": "Only agency administrators have permission to force-regenerate existing installment plans."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Delete existing payments to regenerate cleanly
            existing_payments.delete()

        created_payments = generate_deal_installment_plan(deal)
        serializer = PaymentListSerializer(created_payments, many=True)
        return Response(
            {
                "message": f"Successfully generated {len(created_payments)} installments for deal {deal.id}.",
                "total_scheduled_amount": str(net_amount),
                "installments": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )
