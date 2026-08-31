from django.contrib import admin
from .models import Deal


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = (
        "property",
        "client",
        "agent",
        "deal_type",
        "deal_status",
        "agreed_price",
        "booking_amount",
        "commission_amount",
        "commission_status",
        "deal_date",
        "created_at",
    )
    list_filter = (
        "deal_status",
        "deal_type",
        "commission_status",
        "is_installment",
        "installment_frequency",
        "agent",
        "deal_date",
        "created_at",
    )
    search_fields = (
        "property__title",
        "property__address",
        "client__full_name",
        "client__phone_number",
        "agent__email",
        "agent__first_name",
        "agent__last_name",
        "notes",
    )
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Transaction Parties & Asset",
            {
                "fields": (
                    "property",
                    "client",
                    "agent",
                    "deal_type",
                    "deal_status",
                )
            },
        ),
        (
            "Financial Settlement & Commission",
            {
                "fields": (
                    "agreed_price",
                    "booking_amount",
                    ("commission_percentage", "commission_amount"),
                    "commission_status",
                )
            },
        ),
        (
            "Installment Plan Structure",
            {
                "fields": (
                    "is_installment",
                    ("number_of_installments", "installment_frequency"),
                    "payment_terms_notes",
                )
            },
        ),
        (
            "Schedule & History",
            {
                "fields": (
                    ("deal_date", "expected_completion_date"),
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
