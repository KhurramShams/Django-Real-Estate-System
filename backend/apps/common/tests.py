from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.common.services.storage import SupabaseStorageService
from apps.common.pagination import StandardResultsSetPagination


class HealthCheckAPITests(APITestCase):
    """Test health check endpoint."""

    def test_health_check_endpoint(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertIn("database", response.data)
        self.assertEqual(response.data["database"]["status"], "healthy")
        self.assertIn("timestamp", response.data)


class SupabaseStorageServiceTests(TestCase):
    """Test Supabase Storage service operations."""

    def setUp(self):
        self.service = SupabaseStorageService(
            supabase_url="https://mock-test.supabase.co",
            supabase_key="mock-key",
            bucket_name="test-bucket",
        )

    def test_upload_file_returns_path_and_url(self):
        file_content = b"fake-image-bytes"
        result = self.service.upload_file(
            file_path="properties/unit-101/main.jpg",
            file_content=file_content,
            content_type="image/jpeg",
        )
        self.assertIn("path", result)
        self.assertEqual(result["path"], "properties/unit-101/main.jpg")
        self.assertIn("url", result)

    def test_get_public_url(self):
        url = self.service.get_public_url("properties/unit-101/main.jpg")
        self.assertTrue("properties/unit-101/main.jpg" in url)

    def test_create_signed_url(self):
        signed_url = self.service.create_signed_url("contracts/contract-01.pdf", expires_in=1800)
        self.assertTrue("contracts/contract-01.pdf" in signed_url)

    def test_delete_file(self):
        result = self.service.delete_file("properties/unit-101/main.jpg")
        self.assertIn("deleted", result)
