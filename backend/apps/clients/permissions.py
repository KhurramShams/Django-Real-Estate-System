from rest_framework import permissions
from apps.accounts.models import UserRole


class ClientPermission(permissions.BasePermission):
    """
    Custom permission for Client model:
    - ADMIN / Superusers: Full read and write access to all clients.
    - AGENT: Full write access for creation; object-level access restricted to assigned clients.
    - ACCOUNTANT / STAFF: Read-only access to all clients; write operations are forbidden (403).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read requests are allowed for all authenticated agency users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write requests (POST, PUT, PATCH, DELETE) are permitted only to ADMIN and AGENT
        return (
            request.user.role in [UserRole.ADMIN, UserRole.AGENT]
            or request.user.is_staff
            or request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins, superusers, and staff/accountants reading data have global access
        if (
            request.user.role == UserRole.ADMIN
            or request.user.is_superuser
            or (
                request.method in permissions.SAFE_METHODS
                and request.user.role in [UserRole.ACCOUNTANT, UserRole.STAFF]
            )
        ):
            return True

        # Agents can only view, edit, or delete clients assigned to them
        if request.user.role == UserRole.AGENT:
            return obj.assigned_agent_id == request.user.id

        return False
