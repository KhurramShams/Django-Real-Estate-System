from rest_framework import permissions
from apps.accounts.models import UserRole


class PaymentPermission(permissions.BasePermission):
    """
    Custom permission for Payment management:
    - ADMIN / Superuser: Full read and write access to all payments.
    - ACCOUNTANT: Full read and write access to all payments (core ledger responsibility).
    - AGENT: Read-only access to payments belonging to deals assigned to them (obj.deal.agent == request.user). Write requests rejected (403).
    - STAFF: Global read-only access (403 on write).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read requests allowed for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write requests (POST, PUT, PATCH, DELETE) permitted for ADMIN and ACCOUNTANT
        return (
            request.user.role in [UserRole.ADMIN, UserRole.ACCOUNTANT]
            or request.user.is_staff
            or request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin, superuser, and accountant have global access
        if (
            request.user.role in [UserRole.ADMIN, UserRole.ACCOUNTANT]
            or request.user.is_superuser
        ):
            return True

        # Read requests for other roles:
        if request.method in permissions.SAFE_METHODS:
            # Staff can read all payments
            if request.user.role == UserRole.STAFF:
                return True
            # Agents can only view payments for their assigned deals
            if request.user.role == UserRole.AGENT:
                return obj.deal.agent_id == request.user.id

        # Non-admin/non-accountants cannot modify or delete
        return False
