from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from apps.common.models import TimeStampedUUIDModel


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin / Agency Owner"
    AGENT = "agent", "Real Estate Agent"
    ACCOUNTANT = "accountant", "Accountant / Finance"
    STAFF = "staff", "Office Staff"


class UserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier for authentication.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedUUIDModel):
    """
    Custom User model with UUID primary key, role assignment, and email authentication.
    """

    email = models.EmailField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text="Primary email address used for login",
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(
        max_length=30,
        blank=True,
        db_index=True,
        help_text="Contact telephone / mobile number",
    )
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.AGENT,
        db_index=True,
        help_text="User access role within the agency",
    )
    avatar_url = models.URLField(
        blank=True,
        null=True,
        help_text="Public URL to profile avatar image in Supabase Storage",
    )

    is_staff = models.BooleanField(
        default=False,
        help_text="Designates whether the user can log into Django admin site.",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "role"]),
            models.Index(fields=["phone_number"]),
        ]

    def __str__(self):
        full_name = self.get_full_name()
        return f"{full_name} ({self.email}) - {self.role}" if full_name else f"{self.email} ({self.role})"

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self) -> str:
        return self.first_name.strip() or self.email
