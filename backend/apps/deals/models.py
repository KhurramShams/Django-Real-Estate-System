from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.models import TimeStampedUUIDModel
from apps.properties.models import Property, PropertyStatus, ListingType
from apps.clients.models import Client


class DealType(models.TextChoices):
    SALE = "sale", "Sale Transaction"
    RENT = "rent", "Rental Lease"


class DealStatus(models.TextChoices):
    NEGOTIATION = "negotiation", "In Negotiation"
    BOOKED = "booked", "Token / Booked"
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Closed / Completed"
    CANCELLED = "cancelled", "Cancelled"


class CommissionStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"


class InstallmentFrequency(models.TextChoices):
    MONTHLY = "monthly", "Monthly"
    QUARTERLY = "quarterly", "Quarterly"
    BI_ANNUALLY = "bi_annually", "Bi-Annually"
    ANNUALLY = "annually", "Annually"


class Deal(TimeStampedUUIDModel):
    """
    Core Deal model linking Property, Client, and Agent for transaction lifecycle tracking.
    """

    # Relationships
    property = models.ForeignKey(
        Property,
        on_delete=models.PROTECT,
        related_name="deals",
        help_text="Property involved in this transaction",
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name="deals",
        help_text="Client (buyer/tenant or seller/landlord) for this deal",
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="deals",
        help_text="Agent managing this deal",
    )

    # Classification & Lifecycle
    deal_type = models.CharField(
        max_length=20,
        choices=DealType.choices,
        default=DealType.SALE,
        db_index=True,
        help_text="Transaction type: Sale or Rent",
    )
    deal_status = models.CharField(
        max_length=30,
        choices=DealStatus.choices,
        default=DealStatus.NEGOTIATION,
        db_index=True,
        help_text="Current transaction stage",
    )

    # Financials
    agreed_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        db_index=True,
        help_text="Final agreed deal amount in currency",
    )
    booking_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Initial token / down payment received",
    )
    commission_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Commission rate percentage (e.g. 1.00 for 1%)",
    )
    commission_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calculated or fixed commission in currency",
    )
    commission_status = models.CharField(
        max_length=20,
        choices=CommissionStatus.choices,
        default=CommissionStatus.PENDING,
        db_index=True,
        help_text="Settlement status of agency commission",
    )

    # Installment Plan Terms
    is_installment = models.BooleanField(
        default=False,
        help_text="Whether this deal is structured on an installment schedule",
    )
    number_of_installments = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Total number of installments (if applicable)",
    )
    installment_frequency = models.CharField(
        max_length=20,
        choices=InstallmentFrequency.choices,
        null=True,
        blank=True,
        help_text="Payment frequency (monthly, quarterly, etc.)",
    )
    payment_terms_notes = models.TextField(
        blank=True,
        help_text="Terms regarding milestones, token adjustments, and installment breakdown",
    )

    # Key Dates & Remarks
    deal_date = models.DateField(
        default=timezone.localdate,
        db_index=True,
        help_text="Date when deal terms were agreed upon",
    )
    expected_completion_date = models.DateField(
        null=True,
        blank=True,
        help_text="Target settlement / possession transfer date",
    )
    notes = models.TextField(
        blank=True,
        help_text="General deal notes and negotiation history",
    )

    class Meta:
        verbose_name = "Deal"
        verbose_name_plural = "Deals"
        ordering = ["-created_at"]
        indexes = [
            # Agent pipeline index
            models.Index(fields=["agent", "deal_status"]),
            # Property deal tracking index
            models.Index(fields=["property", "deal_status"]),
            # Client deals index
            models.Index(fields=["client", "deal_status"]),
            # Type and status
            models.Index(fields=["deal_type", "deal_status"]),
        ]

    def __str__(self):
        return f"Deal: {self.property.title} - {self.client.full_name} ({self.get_deal_status_display()})"

    def save(self, *args, **kwargs):
        # Commission auto-calculation & precedence rules
        if self.agreed_price and self.agreed_price > 0:
            if self.commission_percentage is not None:
                # Rule 1 & 3: commission_percentage always takes precedence and drives commission_amount
                self.commission_amount = round(
                    (self.agreed_price * self.commission_percentage) / 100, 2
                )
            elif self.commission_amount is not None:
                # Rule 2: Only commission_amount provided -> derive and store commission_percentage
                self.commission_percentage = round(
                    (self.commission_amount / self.agreed_price) * 100, 2
                )

        super().save(*args, **kwargs)

        # Property inventory status synchronization
        self._sync_property_status()

    def _sync_property_status(self):
        """
        Synchronizes property status based on deal stage:
        - Completed sale -> Property 'sold'
        - Completed rent -> Property 'rented'
        - Cancelled -> Property reverts to 'available' IF no other active deals exist
        - Negotiation / Booked / In Progress -> Property 'under_negotiation' if currently available
        """
        prop = self.property
        if not prop:
            return

        if self.deal_status == DealStatus.COMPLETED:
            if self.deal_type == DealType.SALE and prop.status != PropertyStatus.SOLD:
                prop.status = PropertyStatus.SOLD
                prop.save(update_fields=["status", "updated_at"])
            elif self.deal_type == DealType.RENT and prop.status != PropertyStatus.RENTED:
                prop.status = PropertyStatus.RENTED
                prop.save(update_fields=["status", "updated_at"])

        elif self.deal_status == DealStatus.CANCELLED:
            # Check if any OTHER active deal exists for this property
            has_other_active_deal = (
                Deal.objects.filter(
                    property=prop,
                    deal_status__in=[
                        DealStatus.NEGOTIATION,
                        DealStatus.BOOKED,
                        DealStatus.IN_PROGRESS,
                    ],
                )
                .exclude(id=self.id)
                .exists()
            )
            # Only revert to available if no other active deals exist and property wasn't marked sold by another deal
            if not has_other_active_deal and prop.status not in [
                PropertyStatus.SOLD,
                PropertyStatus.RENTED,
            ]:
                if prop.status != PropertyStatus.AVAILABLE:
                    prop.status = PropertyStatus.AVAILABLE
                    prop.save(update_fields=["status", "updated_at"])

        elif self.deal_status in [
            DealStatus.NEGOTIATION,
            DealStatus.BOOKED,
            DealStatus.IN_PROGRESS,
        ]:
            if prop.status == PropertyStatus.AVAILABLE:
                prop.status = PropertyStatus.UNDER_NEGOTIATION
                prop.save(update_fields=["status", "updated_at"])
