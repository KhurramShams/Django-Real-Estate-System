from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DealViewSet

app_name = "deals"

router = DefaultRouter()
router.register(r"", DealViewSet, basename="deal")

urlpatterns = [
    path("", include(router.urls)),
]
