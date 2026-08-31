from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedUUIDModel
from apps.properties.models import PropertyType, ListingType


class ClientType(models.TextChoices):
    BUYER = "buyer", "Buyer"
    SELLER = "seller", "Seller"
    TENANT = "tenant", "Tenant"
    LANDLORD = "landlord", "Landlord"


class ClientSource(models.TextChoices):
    REFERRAL = "referral", "Referral"
    WALK_IN = "walk_in", "Walk-in"
    WEBSITE = "website", "Website Inquiry"
    SOCIAL_MEDIA = "social_media", "Social Media (Instagram / Facebook)"
    PORTAL_ZAMEEN = "portal_zameen", "Zameen.com"
    PORTAL_OLX = "portal_olx", "OLX"
    DIRECT_CALL = "direct_call", "Direct Phone Call"
    OTHER = "other", "Other"


class Client(TimeStampedUUIDModel):
    """
    Core Client model representing buyers, sellers, tenants, and landlords.
    """

    # Basic Contact Info
    full_name = models.CharField(
        max_length=200,
        db_index=True,
        help_text="Full legal name of the client",
    )
    phone_number = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Primary contact number (e.g. +92-300-1234567)",
    )
    email = models.EmailField(
        blank=True,
        db_index=True,
        help_text="Contact email address (optional)",
    )
    cnic = models.CharField(
        max_length=20,
        blank=True,
        db_index=True,
        help_text="National Identity Card Number (e.g. 42101-1234567-1)",
    )
    address = models.CharField(
        max_length=255,
        blank=True,
        help_text="Residential / Business address",
    )

    # Role & Acquisition
    client_type = models.CharField(
        max_length=20,
        choices=ClientType.choices,
        default=ClientType.BUYER,
        db_index=True,
        help_text="Client classification within the pipeline",
    )
    source = models.CharField(
        max_length=30,
        choices=ClientSource.choices,
        default=ClientSource.WALK_IN,
        db_index=True,
        help_text="How the client was acquired",
    )

    # Requirements & Criteria
    preferred_property_type = models.CharField(
        max_length=30,
        choices=PropertyType.choices,
        blank=True,
        help_text="Type of property the client is seeking or offering",
    )
    preferred_listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices,
        blank=True,
        help_text="Transaction preference: Sale or Rent",
    )
    budget_min = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum price / budget limit in currency",
    )
    budget_max = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Maximum price / budget limit in currency",
    )
    preferred_city = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="Target city (e.g., Karachi, Lahore, Islamabad)",
    )
    preferred_locality = models.CharField(
        max_length=150,
        blank=True,
        help_text="Target sector, phase, or neighborhood",
    )

    # Relationship & Notes
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clients",
        help_text="Agency agent assigned to manage this client",
    )
    notes = models.TextField(
        blank=True,
        help_text="Free-text agent interaction remarks and special instructions",
    )

    class Meta:
        verbose_name = "Client"
        verbose_name_plural = "Clients"
        ordering = ["-created_at"]
        indexes = [
            # Optimize agent-specific client pipeline listings
            models.Index(fields=["assigned_agent", "client_type"]),
            # Optimize regional buyer/tenant matching queries
            models.Index(fields=["preferred_city", "client_type"]),
            # Optimize name lookup
            models.Index(fields=["full_name", "client_type"]),
        ]

    def __str__(self):
        agent_name = (
            self.assigned_agent.get_full_name()
            if self.assigned_agent
            else "Unassigned"
        )
        return f"{self.full_name} ({self.get_client_type_display()}) - Agent: {agent_name}"
