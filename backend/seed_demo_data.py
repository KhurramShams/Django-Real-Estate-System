import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole

User = get_user_model()

def seed():
    users_data = [
        {
            "email": "admin.paytest@luxuryrealty.com",
            "password": "AdminPass2026!",
            "first_name": "Admin",
            "last_name": "Boss",
            "role": UserRole.ADMIN,
            "is_staff": True,
            "is_superuser": True,
        },
        {
            "email": "agent.pay.a@luxuryrealty.com",
            "password": "AgentPass2026!",
            "first_name": "Agent",
            "last_name": "Alpha",
            "role": UserRole.AGENT,
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "email": "accountant.paytest@luxuryrealty.com",
            "password": "AccountantPass2026!",
            "first_name": "Accountant",
            "last_name": "Pro",
            "role": UserRole.ACCOUNTANT,
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "email": "staff.test@luxuryrealty.com",
            "password": "StaffPass2026!",
            "first_name": "Staff",
            "last_name": "Member",
            "role": UserRole.STAFF,
            "is_staff": False,
            "is_superuser": False,
        },
    ]

    for u_data in users_data:
        email = u_data["email"]
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": u_data["first_name"],
                "last_name": u_data["last_name"],
                "role": u_data["role"],
                "is_staff": u_data["is_staff"],
                "is_superuser": u_data["is_superuser"],
            },
        )
        user.set_password(u_data["password"])
        user.role = u_data["role"]
        user.is_staff = u_data["is_staff"]
        user.is_superuser = u_data["is_superuser"]
        user.save()
        status_str = "Created" if created else "Updated password/role for"
        print(f"[{status_str}] {email} ({u_data['role'].upper()})")

if __name__ == "__main__":
    seed()
