from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole
from .models import Client

User = get_user_model()


class AssignedAgentSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "phone_number"]


class ClientListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for list views.
    """

    client_type_display = serializers.CharField(
        source="get_client_type_display", read_only=True
    )
    source_display = serializers.CharField(
        source="get_source_display", read_only=True
    )
    assigned_agent_name = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            "id",
            "full_name",
            "phone_number",
            "email",
            "cnic",
            "client_type",
            "client_type_display",
            "source",
            "source_display",
            "preferred_property_type",
            "preferred_listing_type",
            "budget_min",
            "budget_max",
            "preferred_city",
            "preferred_locality",
            "assigned_agent",
            "assigned_agent_name",
            "created_at",
            "updated_at",
        ]

    def get_assigned_agent_name(self, obj):
        return obj.assigned_agent.get_full_name() if obj.assigned_agent else "Unassigned"


class ClientDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer including full notes, address, and agent object.
    """

    client_type_display = serializers.CharField(
        source="get_client_type_display", read_only=True
    )
    source_display = serializers.CharField(
        source="get_source_display", read_only=True
    )
    assigned_agent_details = AssignedAgentSummarySerializer(
        source="assigned_agent", read_only=True
    )

    class Meta:
        model = Client
        fields = [
            "id",
            "full_name",
            "phone_number",
            "email",
            "cnic",
            "address",
            "client_type",
            "client_type_display",
            "source",
            "source_display",
            "preferred_property_type",
            "preferred_listing_type",
            "budget_min",
            "budget_max",
            "preferred_city",
            "preferred_locality",
            "assigned_agent",
            "assigned_agent_details",
            "notes",
            "created_at",
            "updated_at",
        ]


class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Client records.
    """

    class Meta:
        model = Client
        fields = [
            "id",
            "full_name",
            "phone_number",
            "email",
            "cnic",
            "address",
            "client_type",
            "source",
            "preferred_property_type",
            "preferred_listing_type",
            "budget_min",
            "budget_max",
            "preferred_city",
            "preferred_locality",
            "assigned_agent",
            "notes",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        request = self.context.get("request")
        # If an agent creates a client and didn't specify an assigned_agent, assign to self
        if request and request.user and request.user.role == UserRole.AGENT:
            if "assigned_agent" not in validated_data or validated_data["assigned_agent"] is None:
                validated_data["assigned_agent"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        # Only ADMIN (or staff/superuser) can modify assigned_agent on update
        if request and request.user:
            if (
                request.user.role != UserRole.ADMIN
                and not request.user.is_superuser
                and not request.user.is_staff
            ):
                validated_data.pop("assigned_agent", None)
        return super().update(instance, validated_data)
