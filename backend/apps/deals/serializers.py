from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole
from apps.properties.models import Property, PropertyStatus
from apps.clients.models import Client
from .models import Deal, DealStatus, DealType, CommissionStatus

User = get_user_model()


class PropertySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "property_type",
            "listing_type",
            "status",
            "city",
            "locality",
            "address",
            "size",
            "size_unit",
            "price",
        ]


class ClientSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "full_name",
            "phone_number",
            "email",
            "cnic",
            "client_type",
        ]


class AgentSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "role"]


class DealListSerializer(serializers.ModelSerializer):
    """
    Optimized list serializer for deal records.
    """

    property_title = serializers.CharField(source="property.title", read_only=True)
    property_city = serializers.CharField(source="property.city", read_only=True)
    client_name = serializers.CharField(source="client.full_name", read_only=True)
    client_phone = serializers.CharField(source="client.phone_number", read_only=True)
    agent_name = serializers.CharField(source="agent.get_full_name", read_only=True)

    deal_type_display = serializers.CharField(source="get_deal_type_display", read_only=True)
    deal_status_display = serializers.CharField(source="get_deal_status_display", read_only=True)
    commission_status_display = serializers.CharField(
        source="get_commission_status_display", read_only=True
    )

    class Meta:
        model = Deal
        fields = [
            "id",
            "property",
            "property_title",
            "property_city",
            "client",
            "client_name",
            "client_phone",
            "agent",
            "agent_name",
            "deal_type",
            "deal_type_display",
            "deal_status",
            "deal_status_display",
            "agreed_price",
            "booking_amount",
            "commission_amount",
            "commission_status",
            "commission_status_display",
            "is_installment",
            "deal_date",
            "expected_completion_date",
            "created_at",
            "updated_at",
        ]


class DealDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for deal records with nested relation objects.
    """

    property_details = PropertySummarySerializer(source="property", read_only=True)
    client_details = ClientSummarySerializer(source="client", read_only=True)
    agent_details = AgentSummarySerializer(source="agent", read_only=True)

    deal_type_display = serializers.CharField(source="get_deal_type_display", read_only=True)
    deal_status_display = serializers.CharField(source="get_deal_status_display", read_only=True)
    commission_status_display = serializers.CharField(
        source="get_commission_status_display", read_only=True
    )
    installment_frequency_display = serializers.CharField(
        source="get_installment_frequency_display", read_only=True
    )

    class Meta:
        model = Deal
        fields = [
            "id",
            "property",
            "property_details",
            "client",
            "client_details",
            "agent",
            "agent_details",
            "deal_type",
            "deal_type_display",
            "deal_status",
            "deal_status_display",
            "agreed_price",
            "booking_amount",
            "commission_percentage",
            "commission_amount",
            "commission_status",
            "commission_status_display",
            "is_installment",
            "number_of_installments",
            "installment_frequency",
            "installment_frequency_display",
            "payment_terms_notes",
            "deal_date",
            "expected_completion_date",
            "notes",
            "created_at",
            "updated_at",
        ]


class DealCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Deal records with business validation.
    """

    agent = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Deal
        fields = [
            "id",
            "property",
            "client",
            "agent",
            "deal_type",
            "deal_status",
            "agreed_price",
            "booking_amount",
            "commission_percentage",
            "commission_amount",
            "commission_status",
            "is_installment",
            "number_of_installments",
            "installment_frequency",
            "payment_terms_notes",
            "deal_date",
            "expected_completion_date",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        prop = attrs.get("property") or (self.instance.property if self.instance else None)
        deal_type = attrs.get("deal_type") or (self.instance.deal_type if self.instance else None)
        deal_status = attrs.get("deal_status") or (
            self.instance.deal_status if self.instance else DealStatus.NEGOTIATION
        )

        if not prop:
            raise serializers.ValidationError({"property": "A valid property is required."})

        # 1. Validate deal_type matches property listing_type
        if deal_type and prop.listing_type and deal_type != prop.listing_type:
            raise serializers.ValidationError(
                {
                    "deal_type": f"Deal type '{deal_type}' must match the property's listing type '{prop.listing_type}'."
                }
            )

        # 2. Prevent multiple active deals on the same property
        active_statuses = [
            DealStatus.NEGOTIATION,
            DealStatus.BOOKED,
            DealStatus.IN_PROGRESS,
        ]
        if deal_status in active_statuses:
            active_deals_query = Deal.objects.filter(
                property=prop,
                deal_status__in=active_statuses,
            )
            if self.instance:
                active_deals_query = active_deals_query.exclude(id=self.instance.id)

            if active_deals_query.exists():
                raise serializers.ValidationError(
                    {
                        "property": "This property already has an active deal in progress. Please resolve or cancel the existing active deal before creating a new one."
                    }
                )

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        # If creator didn't specify agent, default to request.user
        if "agent" not in validated_data or validated_data["agent"] is None:
            if request and request.user and request.user.is_authenticated:
                validated_data["agent"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        # Non-admins cannot reassign deal agent
        if request and request.user:
            if (
                request.user.role != UserRole.ADMIN
                and not request.user.is_superuser
                and not request.user.is_staff
            ):
                validated_data.pop("agent", None)
        return super().update(instance, validated_data)


class AccountantDealCommissionSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for Accountant role modifying commission status exclusively.
    """

    class Meta:
        model = Deal
        fields = ["id", "commission_status", "commission_amount", "commission_percentage"]
        read_only_fields = ["id", "commission_amount", "commission_percentage"]
