from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "client_type",
        "phone_number",
        "email",
        "preferred_city",
        "budget_max",
        "source",
        "assigned_agent",
        "created_at",
    )
    list_filter = (
        "client_type",
        "source",
        "preferred_city",
        "preferred_property_type",
        "preferred_listing_type",
        "assigned_agent",
        "created_at",
    )
    search_fields = (
        "full_name",
        "phone_number",
        "email",
        "cnic",
        "preferred_locality",
        "preferred_city",
        "notes",
    )
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "full_name",
                    "client_type",
                    "phone_number",
                    "email",
                    "cnic",
                    "address",
                    "source",
                )
            },
        ),
        (
            "Property Requirements & Budget",
            {
                "fields": (
                    ("preferred_property_type", "preferred_listing_type"),
                    ("budget_min", "budget_max"),
                    ("preferred_city", "preferred_locality"),
                )
            },
        ),
        (
            "Assignment & Interaction Remarks",
            {
                "fields": (
                    "assigned_agent",
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
