from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserListView,
)

app_name = "accounts"

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("register/", UserRegistrationView.as_view(), name="user_register"),
    path("me/", UserProfileView.as_view(), name="user_profile"),
    path("users/", UserListView.as_view(), name="user_list"),
]
