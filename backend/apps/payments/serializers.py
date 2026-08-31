from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from apps.deals.models import Deal
from .models import Payment, PaymentStatus, PaymentMethod


class PaymentDealSummarySerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_city = serializers.CharField(source="property.city", read_only=True)
    client_name = serializers.CharField(source="client.full_name", read_only=True)
    client_phone = serializers.CharField(source="client.phone_number", read_only=True)
    agent_name = serializers.CharField(source="agent.get_full_name", read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id",
            "deal_type",
            "deal_status",
            "agreed_price",
            "booking_amount",
            "property_title",
            "property_city",
            "client_name",
            "client_phone",
            "agent_name",
        ]


class PaymentListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for payment list views.
    """

    property_title = serializers.CharField(source="deal.property.title", read_only=True)
    client_name = serializers.CharField(source="deal.client.full_name", read_only=True)
    agent_name = serializers.CharField(source="deal.agent.get_full_name", read_only=True)

    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    remaining_balance = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    effective_status = serializers.CharField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "deal",
            "property_title",
            "client_name",
            "agent_name",
            "amount",
            "amount_paid",
            "remaining_balance",
            "due_date",
            "paid_date",
            "payment_status",
            "payment_status_display",
            "effective_status",
            "is_overdue",
            "payment_method",
            "payment_method_display",
            "installment_number",
            "total_installments",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]


class PaymentDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for payment records.
    """

    deal_details = PaymentDealSummarySerializer(source="deal", read_only=True)
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    remaining_balance = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    effective_status = serializers.CharField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "deal",
            "deal_details",
            "amount",
            "amount_paid",
            "remaining_balance",
            "due_date",
            "paid_date",
            "payment_status",
            "payment_status_display",
            "effective_status",
            "is_overdue",
            "payment_method",
            "payment_method_display",
            "installment_number",
            "total_installments",
            "transaction_reference",
            "notes",
            "created_at",
            "updated_at",
        ]


class PaymentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Payment records.
    """

    remaining_balance = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    effective_status = serializers.CharField(read_only=True)
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "deal",
            "amount",
            "amount_paid",
            "remaining_balance",
            "due_date",
            "paid_date",
            "payment_status",
            "payment_status_display",
            "effective_status",
            "is_overdue",
            "payment_method",
            "payment_method_display",
            "installment_number",
            "total_installments",
            "transaction_reference",
            "notes",
        ]
        read_only_fields = ["id", "remaining_balance", "is_overdue", "effective_status"]

    def validate(self, attrs):
        amount = attrs.get("amount") or (self.instance.amount if self.instance else None)
        amount_paid = attrs.get("amount_paid") or (
            self.instance.amount_paid if self.instance else Decimal("0.00")
        )

        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Payment amount must be greater than zero."})

        if amount_paid is not None and amount_paid < 0:
            raise serializers.ValidationError(
                {"amount_paid": "Amount paid cannot be negative."}
            )

        return attrs


class PaymentReceiptSerializer(serializers.Serializer):
    """
    Structured receipt data serializer.
    """

    receipt_number = serializers.SerializerMethodField()
    payment_id = serializers.UUIDField(source="id")
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    amount_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    remaining_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    payment_status = serializers.CharField()
    payment_status_display = serializers.CharField(source="get_payment_status_display")
    effective_status = serializers.CharField()
    payment_method = serializers.CharField()
    payment_method_display = serializers.CharField(source="get_payment_method_display")
    transaction_reference = serializers.CharField()
    due_date = serializers.DateField()
    paid_date = serializers.DateField(allow_null=True)
    installment_number = serializers.IntegerField(allow_null=True)
    total_installments = serializers.IntegerField(allow_null=True)

    deal = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()
    agent = serializers.SerializerMethodField()
    issued_at = serializers.SerializerMethodField()

    def get_receipt_number(self, obj):
        inst = obj.installment_number or 1
        return f"REC-{str(obj.id)[:8].upper()}-{inst}"

    def get_deal(self, obj):
        return {
            "id": str(obj.deal.id),
            "deal_type": obj.deal.deal_type,
            "deal_status": obj.deal.deal_status,
            "agreed_price": str(obj.deal.agreed_price),
            "booking_amount": str(obj.deal.booking_amount),
        }

    def get_property(self, obj):
        prop = obj.deal.property
        return {
            "id": str(prop.id),
            "title": prop.title,
            "property_type": prop.property_type,
            "listing_type": prop.listing_type,
            "city": prop.city,
            "locality": prop.locality,
            "address": prop.address,
        }

    def get_client(self, obj):
        client = obj.deal.client
        return {
            "id": str(client.id),
            "full_name": client.full_name,
            "phone_number": client.phone_number,
            "email": client.email,
            "cnic": client.cnic,
            "address": client.address,
        }

    def get_agent(self, obj):
        agent = obj.deal.agent
        return {
            "id": str(agent.id),
            "full_name": agent.get_full_name(),
            "email": agent.email,
            "phone_number": agent.phone_number,
        }

    def get_issued_at(self, obj):
        return timezone.now().isoformat()
