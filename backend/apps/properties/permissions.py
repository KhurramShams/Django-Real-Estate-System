from rest_framework import permissions
from apps.accounts.models import UserRole


class IsAdminOrAgentOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow:
    - Any authenticated user (Admin, Agent, Accountant, Staff) to view properties.
    - Only ADMIN and AGENT roles to perform write operations (create, update, delete).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are restricted to ADMIN and AGENT (or superusers)
        return (
            request.user.role in [UserRole.ADMIN, UserRole.AGENT]
            or request.user.is_staff
            or request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return (
            request.user.role in [UserRole.ADMIN, UserRole.AGENT]
            or request.user.is_staff
            or request.user.is_superuser
        )
