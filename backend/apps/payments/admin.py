from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "deal",
        "installment_number",
        "amount",
        "amount_paid",
        "payment_status",
        "effective_status",
        "due_date",
        "paid_date",
        "payment_method",
        "transaction_reference",
        "created_at",
    )
    list_filter = (
        "payment_status",
        "payment_method",
        "due_date",
        "paid_date",
        "created_at",
    )
    search_fields = (
        "deal__property__title",
        "deal__property__address",
        "deal__client__full_name",
        "deal__client__phone_number",
        "transaction_reference",
        "notes",
    )
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Deal & Sequence",
            {
                "fields": (
                    "deal",
                    ("installment_number", "total_installments"),
                )
            },
        ),
        (
            "Payment Settlement & Amounts",
            {
                "fields": (
                    ("amount", "amount_paid"),
                    "payment_status",
                    "payment_method",
                    "transaction_reference",
                )
            },
        ),
        (
            "Schedule & Dates",
            {
                "fields": (
                    ("due_date", "paid_date"),
                    "notes",
                )
            },
        ),
        (
            "Audit Metadata",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
