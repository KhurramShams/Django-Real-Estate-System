from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import UserRole
from .models import Payment
from .permissions import PaymentPermission
from .filters import PaymentFilter
from .serializers import (
    PaymentListSerializer,
    PaymentDetailSerializer,
    PaymentCreateUpdateSerializer,
    PaymentReceiptSerializer,
)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for Payments and Installment tracking.
    Enforces role-based queryset scoping:
    - Accountants and Admins have full access to all payments.
    - Agents have read-only access strictly scoped to their assigned deals.
    - Staff has global read-only access.
    """

    permission_classes = [PaymentPermission]
    filterset_class = PaymentFilter
    search_fields = [
        "deal__property__title",
        "deal__property__address",
        "deal__property__city",
        "deal__client__full_name",
        "deal__client__phone_number",
        "transaction_reference",
        "notes",
    ]
    ordering_fields = [
        "due_date",
        "paid_date",
        "amount",
        "amount_paid",
        "installment_number",
        "created_at",
    ]
    ordering = ["due_date", "installment_number"]

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.all().select_related(
            "deal__property", "deal__client", "deal__agent"
        )

        if not user or not user.is_authenticated:
            return Payment.objects.none()

        # Agents are strictly scoped to payments for their own deals
        if user.role == UserRole.AGENT and not (user.is_staff or user.is_superuser):
            return queryset.filter(deal__agent=user)

        # Admins, Accountants, and Staff see all agency payments
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return PaymentListSerializer
        elif self.action == "retrieve":
            return PaymentDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return PaymentCreateUpdateSerializer
        return PaymentDetailSerializer

    @action(detail=True, methods=["get"], url_path="receipt")
    def receipt(self, request, pk=None):
        """
        Returns structured JSON receipt payload for rendering receipts/invoices.
        """
        payment = self.get_object()
        serializer = PaymentReceiptSerializer(payment)
        return Response(serializer.data, status=status.HTTP_200_OK)
