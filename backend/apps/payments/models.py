from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.common.models import TimeStampedUUIDModel
from apps.deals.models import Deal


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PARTIAL = "partial", "Partially Paid"
    PAID = "paid", "Fully Paid"
    OVERDUE = "overdue", "Overdue"


class PaymentMethod(models.TextChoices):
    CASH = "cash", "Cash"
    BANK_TRANSFER = "bank_transfer", "Bank Transfer / Wire"
    CHEQUE = "cheque", "Cheque / Pay Order"
    ONLINE = "online", "Online Payment / Card"
    OTHER = "other", "Other"


class Payment(TimeStampedUUIDModel):
    """
    Core Payment model representing scheduled installments, one-time payments,
    receipt tracking, and partial settlements for Deal records.
    """

    # Core relationship
    deal = models.ForeignKey(
        Deal,
        on_delete=models.CASCADE,
        related_name="payments",
        help_text="The deal transaction associated with this payment",
    )

    # Financial breakdown
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Scheduled installment or payment amount in currency",
    )
    amount_paid = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Actual amount collected towards this payment so far",
    )

    # Dates
    due_date = models.DateField(
        db_index=True,
        help_text="Date by which payment is scheduled/expected",
    )
    paid_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when payment was received/cleared",
    )

    # Classification
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
        help_text="Current settlement status of this payment",
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER,
        help_text="Channel/mode of payment",
    )

    # Installment sequence & references
    installment_number = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Sequence number (e.g. 1 for '1 of 6'); null for one-off payments",
    )
    total_installments = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Total installments in the plan (e.g. 6)",
    )
    transaction_reference = models.CharField(
        max_length=150,
        blank=True,
        help_text="Cheque #, bank deposit slip ID, or transaction reference",
    )
    notes = models.TextField(
        blank=True,
        help_text="Accountant/Agent remarks regarding this payment",
    )

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ["due_date", "installment_number"]
        indexes = [
            # Ordered installment lookup for deals
            models.Index(fields=["deal", "installment_number"]),
            # Deal payment status lookup
            models.Index(fields=["deal", "payment_status"]),
            # Due date filter index
            models.Index(fields=["due_date", "payment_status"]),
        ]

    def __str__(self):
        seq = (
            f"Installment #{self.installment_number}"
            if self.installment_number
            else "Payment"
        )
        return f"{seq} for {self.deal.property.title} - PKR {self.amount} ({self.get_payment_status_display()})"

    @property
    def remaining_balance(self) -> Decimal:
        """Computes the unpaid remainder balance for this scheduled payment."""
        bal = self.amount - (self.amount_paid or Decimal("0.00"))
        return max(Decimal("0.00"), bal)

    @property
    def is_overdue(self) -> bool:
        """Returns True if payment is due in the past and not fully settled."""
        today = timezone.localdate()
        return (
            self.due_date < today
            and self.payment_status not in [PaymentStatus.PAID]
            and self.remaining_balance > 0
        )

    @property
    def effective_status(self) -> str:
        """
        Dynamically calculates payment status:
        - 'paid': amount_paid >= amount
        - 'partial_overdue': due_date has passed, amount_paid > 0, and amount_paid < amount
        - 'overdue': due_date has passed, amount_paid == 0 (or null), and not fully paid
        - 'partial': amount_paid > 0, amount_paid < amount, and due_date has NOT passed
        - 'pending': amount_paid == 0 (or null), and due_date has NOT passed
        """
        amount = self.amount or Decimal("0.00")
        amount_paid = self.amount_paid or Decimal("0.00")
        today = timezone.localdate()
        is_past_due = self.due_date < today

        if amount_paid >= amount and amount > 0:
            return "paid"

        if is_past_due:
            if amount_paid > 0:
                return "partial_overdue"
            return "overdue"

        if amount_paid > 0:
            return "partial"

        return "pending"

    def save(self, *args, **kwargs):
        # Auto-update status based on amount_paid vs amount
        if self.amount_paid >= self.amount and self.amount > 0:
            self.payment_status = PaymentStatus.PAID
            if not self.paid_date:
                self.paid_date = timezone.localdate()
        elif Decimal("0.00") < self.amount_paid < self.amount:
            self.payment_status = PaymentStatus.PARTIAL
        elif self.amount_paid == Decimal("0.00") and self.payment_status == PaymentStatus.PARTIAL:
            self.payment_status = PaymentStatus.PENDING

        super().save(*args, **kwargs)
