import uuid
from django.db import models


class TimeStampedUUIDModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_at`` and ``updated_at`` fields, a standard UUID primary key,
    and a soft-deletion flag ``is_active``.

    Why UUID Primary Key:
    - Prevents ID enumeration attacks across client leads, transactions, and properties.
    - Enables safe offline / distributed ID generation.
    - Decouples public resource identifiers from internal database auto-increment sequences.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUIDv4) for this record",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the record was created",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last modified",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Soft deletion flag",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]
