from rest_framework import viewsets
from apps.accounts.models import UserRole
from .models import Client
from .permissions import ClientPermission
from .filters import ClientFilter
from .serializers import (
    ClientListSerializer,
    ClientDetailSerializer,
    ClientCreateUpdateSerializer,
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for Client management.
    Enforces role-based queryset scoping:
    - Agents only see clients assigned to them.
    - Admins, Accountants, and Staff see all clients across the agency.
    """

    permission_classes = [ClientPermission]
    filterset_class = ClientFilter
    search_fields = [
        "full_name",
        "phone_number",
        "email",
        "cnic",
        "preferred_locality",
        "preferred_city",
    ]
    ordering_fields = [
        "created_at",
        "updated_at",
        "full_name",
        "budget_max",
        "budget_min",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        queryset = Client.objects.all().select_related("assigned_agent")

        if not user or not user.is_authenticated:
            return Client.objects.none()

        # Agents are strictly scoped to clients assigned to them
        if user.role == UserRole.AGENT and not (user.is_staff or user.is_superuser):
            return queryset.filter(assigned_agent=user)

        # Admins, Accountants, and Staff see all clients
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return ClientListSerializer
        elif self.action == "retrieve":
            return ClientDetailSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ClientCreateUpdateSerializer
        return ClientDetailSerializer
