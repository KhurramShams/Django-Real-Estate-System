from django.urls import path
from .views import DashboardSummaryView

app_name = "reports"

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard_summary"),
]
