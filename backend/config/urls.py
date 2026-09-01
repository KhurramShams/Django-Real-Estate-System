from django.contrib import admin
from django.urls import path, include
from apps.common.views import APIRootView

urlpatterns = [
    # API Root Landing View
    path("", APIRootView.as_view(), name="api_root"),

    # Django Admin Site
    path("admin/", admin.site.urls),

    # API Version 1
    path("api/v1/", include("apps.common.urls", namespace="common")),
    path("api/v1/auth/", include("apps.accounts.urls", namespace="accounts")),
    path("api/v1/properties/", include("apps.properties.urls", namespace="properties")),
    path("api/v1/clients/", include("apps.clients.urls", namespace="clients")),
    path("api/v1/leads/", include("apps.leads.urls", namespace="leads")),
    path("api/v1/deals/", include("apps.deals.urls", namespace="deals")),
    path("api/v1/payments/", include("apps.payments.urls", namespace="payments")),
    path("api/v1/dashboard/", include("apps.reports.urls", namespace="dashboard")),
    path("api/v1/reports/", include("apps.reports.urls", namespace="reports")),
]
