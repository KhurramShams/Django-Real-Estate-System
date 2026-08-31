from django.db import models
from apps.common.models import TimeStampedUUIDModel


class PropertyType(models.TextChoices):
    RESIDENTIAL = "residential", "Residential"
    COMMERCIAL = "commercial", "Commercial"
    PLOT = "plot", "Plot / Land"
    RENTAL = "rental", "Rental Property"
    INDUSTRIAL = "industrial", "Industrial"


class ListingType(models.TextChoices):
    SALE = "sale", "For Sale"
    RENT = "rent", "For Rent"


class SizeUnit(models.TextChoices):
    MARLA = "marla", "Marla"
    KANAL = "kanal", "Kanal"
    SQ_FT = "sq_ft", "Sq. Ft."
    SQ_YD = "sq_yd", "Sq. Yd."
    ACRE = "acre", "Acre"


class PropertyStatus(models.TextChoices):
    AVAILABLE = "available", "Available"
    UNDER_NEGOTIATION = "under_negotiation", "Under Negotiation"
    SOLD = "sold", "Sold"
    RENTED = "rented", "Rented"
    OFF_MARKET = "off_market", "Off Market"


class Amenity(TimeStampedUUIDModel):
    """
    Amenity lookup model (e.g. Parking, 24/7 Security, Backup Generator, Corner Plot).
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Amenity or feature name",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Icon identifier for frontend rendering",
    )
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Amenity"
        verbose_name_plural = "Amenities"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Property(TimeStampedUUIDModel):
    """
    Core Property model representing a real estate listing.
    """

    title = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Listing headline / property title",
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed property description",
    )
    property_type = models.CharField(
        max_length=30,
        choices=PropertyType.choices,
        default=PropertyType.RESIDENTIAL,
        db_index=True,
        help_text="Category of property",
    )
    listing_type = models.CharField(
        max_length=20,
        choices=ListingType.choices,
        default=ListingType.SALE,
        db_index=True,
        help_text="Listing purpose: Sale or Rent",
    )
    status = models.CharField(
        max_length=30,
        choices=PropertyStatus.choices,
        default=PropertyStatus.AVAILABLE,
        db_index=True,
        help_text="Current transaction status",
    )

    # Location Information
    address = models.CharField(
        max_length=255,
        help_text="Street address / House or Building Number",
    )
    city = models.CharField(
        max_length=100,
        db_index=True,
        help_text="City (e.g., Karachi, Lahore, Islamabad)",
    )
    locality = models.CharField(
        max_length=150,
        db_index=True,
        help_text="Sector, Phase, Block, or Neighborhood (e.g., DHA Phase 6, Bahria Town)",
    )
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="GPS Latitude coordinate for map view",
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="GPS Longitude coordinate for map view",
    )

    # Dimensions & Pricing
    size = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total area size value",
    )
    size_unit = models.CharField(
        max_length=20,
        choices=SizeUnit.choices,
        default=SizeUnit.MARLA,
        help_text="Measurement unit (Marla, Kanal, Sq Ft, etc.)",
    )
    price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_index=True,
        help_text="Listing price in currency (manually set)",
    )

    # Ownership & Contact Details (Prepared for future Client FK)
    owner_name = models.CharField(
        max_length=200,
        help_text="Property owner full name",
    )
    owner_contact = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Owner phone number / WhatsApp",
    )
    owner_email = models.EmailField(
        blank=True,
        help_text="Owner email address",
    )

    # Amenities
    amenities = models.ManyToManyField(
        Amenity,
        blank=True,
        related_name="properties",
        help_text="Associated amenities and features",
    )

    class Meta:
        verbose_name = "Property"
        verbose_name_plural = "Properties"
        ordering = ["-created_at"]
        indexes = [
            # High frequency filter: "available properties under X price"
            models.Index(fields=["status", "price"]),
            # City and type exploration
            models.Index(fields=["city", "property_type", "status"]),
            # Location locality lookup
            models.Index(fields=["city", "locality"]),
            # Listing type & status
            models.Index(fields=["listing_type", "status"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.city} ({self.get_property_type_display()}, {self.get_status_display()})"

    @property
    def primary_image_url(self):
        """Returns the primary image URL or the first available image URL."""
        primary = self.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first_img = self.images.first()
        return first_img.image_url if first_img else None


class PropertyImage(TimeStampedUUIDModel):
    """
    Property image media reference linked to Supabase Storage.
    """

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="images",
        help_text="Associated property listing",
    )
    image_url = models.URLField(
        max_length=1000,
        help_text="Public or signed URL from Supabase Storage",
    )
    storage_path = models.CharField(
        max_length=500,
        help_text="Relative storage bucket path (e.g. properties/<id>/<filename>)",
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        help_text="Short description or room label",
    )
    is_primary = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Designates this image as the main cover photo",
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Sorting order in gallery display",
    )

    class Meta:
        verbose_name = "Property Image"
        verbose_name_plural = "Property Images"
        ordering = ["-is_primary", "display_order", "created_at"]
        indexes = [
            models.Index(fields=["property", "is_primary"]),
        ]

    def __str__(self):
        return f"Image for {self.property.title} ({'Primary' if self.is_primary else 'Gallery'})"

    def save(self, *args, **kwargs):
        # If marked primary, clear primary flag on other images of the same property
        if self.is_primary and self.property_id:
            PropertyImage.objects.filter(
                property_id=self.property_id, is_primary=True
            ).exclude(id=self.id).update(is_primary=False)
        super().save(*args, **kwargs)
