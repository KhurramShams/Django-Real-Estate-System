from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, AmenityViewSet

app_name = "properties"

router = DefaultRouter()
router.register(r"amenities", AmenityViewSet, basename="amenity")
router.register(r"", PropertyViewSet, basename="property")

urlpatterns = [
    path("", include(router.urls)),
]
