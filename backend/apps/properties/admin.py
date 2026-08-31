from django.contrib import admin
from .models import Property, PropertyImage, Amenity


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ("image_url", "storage_path", "caption", "is_primary", "display_order")


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "description", "created_at")
    search_fields = ("name", "description")
    ordering = ("name",)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "city",
        "locality",
        "property_type",
        "listing_type",
        "price",
        "size",
        "size_unit",
        "status",
        "owner_name",
        "created_at",
    )
    list_filter = (
        "status",
        "property_type",
        "listing_type",
        "city",
        "size_unit",
        "created_at",
    )
    search_fields = (
        "title",
        "description",
        "address",
        "locality",
        "city",
        "owner_name",
        "owner_contact",
    )
    filter_horizontal = ("amenities",)
    inlines = [PropertyImageInline]
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Listing Overview",
            {
                "fields": (
                    "title",
                    "description",
                    "property_type",
                    "listing_type",
                    "status",
                )
            },
        ),
        (
            "Location Details",
            {
                "fields": (
                    "address",
                    "city",
                    "locality",
                    "postal_code",
                    ("latitude", "longitude"),
                )
            },
        ),
        (
            "Dimensions & Pricing",
            {
                "fields": (
                    ("size", "size_unit"),
                    "price",
                )
            },
        ),
        (
            "Ownership Information",
            {
                "fields": (
                    "owner_name",
                    "owner_contact",
                    "owner_email",
                )
            },
        ),
        (
            "Features & Amenities",
            {
                "fields": ("amenities",),
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


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = (
        "property",
        "caption",
        "is_primary",
        "display_order",
        "storage_path",
        "created_at",
    )
    list_filter = ("is_primary", "created_at")
    search_fields = ("property__title", "caption", "storage_path")
