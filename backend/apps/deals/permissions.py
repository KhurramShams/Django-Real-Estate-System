from rest_framework import permissions
from apps.accounts.models import UserRole


class DealPermission(permissions.BasePermission):
    """
    Custom permission for Deal management:
    - ADMIN / Superuser: Full read and write access to all deals.
    - AGENT: Full write access for own deals; object access restricted to assigned deals (obj.agent == request.user).
    - ACCOUNTANT: Read-only access to all deals, PLUS write access strictly for `commission_status`.
    - STAFF: Global read-only access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read requests are allowed for all authenticated agency users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write requests:
        # - Action: generate_installment_plan allows ADMIN, AGENT, and ACCOUNTANT
        if getattr(view, "action", None) == "generate_installment_plan":
            return (
                request.user.role in [UserRole.ADMIN, UserRole.AGENT, UserRole.ACCOUNTANT]
                or request.user.is_staff
                or request.user.is_superuser
            )

        # - Creation and Deletion: ADMIN and AGENT only
        if request.method == "POST" or request.method == "DELETE":
            return (
                request.user.role in [UserRole.ADMIN, UserRole.AGENT]
                or request.user.is_staff
                or request.user.is_superuser
            )

        # - Updates (PUT/PATCH): ADMIN, AGENT, and ACCOUNTANT (for commission settlement)
        if request.method in ["PUT", "PATCH"]:
            return (
                request.user.role in [UserRole.ADMIN, UserRole.AGENT, UserRole.ACCOUNTANT]
                or request.user.is_staff
                or request.user.is_superuser
            )

        return False

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin and superuser have unrestricted access
        if request.user.role == UserRole.ADMIN or request.user.is_superuser:
            return True

        # Custom action: generate_installment_plan
        if getattr(view, "action", None) == "generate_installment_plan":
            if request.user.role == UserRole.ACCOUNTANT:
                return True
            if request.user.role == UserRole.AGENT:
                return obj.agent_id == request.user.id
            return False

        # Reading objects
        if request.method in permissions.SAFE_METHODS:
            # Accountants and Staff can view all deals
            if request.user.role in [UserRole.ACCOUNTANT, UserRole.STAFF]:
                return True
            # Agents can only view deals assigned to them
            if request.user.role == UserRole.AGENT:
                return obj.agent_id == request.user.id

        # Modifying objects:
        if request.method in ["PUT", "PATCH"]:
            # Agents can only edit their own deals
            if request.user.role == UserRole.AGENT:
                return obj.agent_id == request.user.id

            # Accountants can edit commission status on any deal
            if request.user.role == UserRole.ACCOUNTANT:
                # Disallow editing non-commission fields
                non_commission_keys = set(request.data.keys()) - {"commission_status"}
                if non_commission_keys:
                    return False
                return True

        # Deleting objects:
        if request.method == "DELETE":
            if request.user.role == UserRole.AGENT:
                return obj.agent_id == request.user.id

        return False
