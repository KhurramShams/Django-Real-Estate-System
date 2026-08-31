"""
WSGI config for Real Estate Management System.
"""
import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))
sys.path.insert(0, str(base_dir / "apps"))

default_settings = (
    "config.settings.production"
    if os.environ.get("VERCEL")
    else "config.settings.development"
)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", default_settings)

application = get_wsgi_application()
app = application
