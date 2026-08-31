from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import UserRole

User = get_user_model()


class UserModelTests(TestCase):
    """Test custom User model creation and role assignment."""

    def test_create_user_with_role(self):
        user = User.objects.create_user(
            email="agent@agency.com",
            password="SecurePassword123!",
            first_name="Jane",
            last_name="Doe",
            role=UserRole.AGENT,
            phone_number="+1234567890",
        )
        self.assertEqual(user.email, "agent@agency.com")
        self.assertEqual(user.role, UserRole.AGENT)
        self.assertEqual(user.get_full_name(), "Jane Doe")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password("SecurePassword123!"))

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@agency.com",
            password="AdminPassword123!",
            first_name="Admin",
            last_name="Boss",
        )
        self.assertEqual(admin.email, "admin@agency.com")
        self.assertEqual(admin.role, UserRole.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)


class AuthAPITests(APITestCase):
    """Test JWT Auth endpoints (register, login, profile)."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="testagent@agency.com",
            password="Password123!",
            first_name="Test",
            last_name="Agent",
            role=UserRole.AGENT,
        )

    def test_jwt_login_returns_tokens_and_user_data(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "testagent@agency.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["email"], "testagent@agency.com")
        self.assertEqual(response.data["user"]["role"], UserRole.AGENT)

    def test_user_registration(self):
        payload = {
            "email": "newagent@agency.com",
            "password": "StrongPassword123!",
            "first_name": "New",
            "last_name": "Agent",
            "role": UserRole.AGENT,
            "phone_number": "+9876543210",
        }
        response = self.client.post("/api/v1/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "newagent@agency.com")
        self.assertTrue(User.objects.filter(email="newagent@agency.com").exists())

    def test_user_profile_authenticated(self):
        # Login to get access token
        login_resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": "testagent@agency.com", "password": "Password123!"},
            format="json",
        )
        token = login_resp.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "testagent@agency.com")
        self.assertEqual(response.data["role"], UserRole.AGENT)
