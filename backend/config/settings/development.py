"""
Development settings for the Real Estate Management System.
"""
from .base import *  # noqa: F403

DEBUG = True

# Allow all origins in local development if needed, or stick to explicit CORS origins
CORS_ALLOW_ALL_ORIGINS = True

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
