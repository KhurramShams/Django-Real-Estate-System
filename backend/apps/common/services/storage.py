"""
Supabase Storage Service
Reusable utility for uploading, retrieving, and deleting media files
(property images, floorplans, client documents, contracts) from Supabase Storage.
"""
import logging
from typing import Optional, Union, BinaryIO
from django.conf import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseStorageService:
    """
    Encapsulates all interactions with Supabase Storage bucket.
    Prevents scattered inline storage calls and enforces uniform pathing and security.
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
    ):
        raw_url = supabase_url or getattr(settings, "SUPABASE_URL", "")
        # Clean S3 / storage sub-paths if present
        if raw_url and ".storage.supabase.co" in raw_url:
            raw_url = raw_url.split(".storage.supabase.co")[0] + ".supabase.co"
        elif raw_url and "/storage/v1" in raw_url:
            raw_url = raw_url.split("/storage/v1")[0]

        self.supabase_url = raw_url.rstrip("/") if raw_url else ""
        self.supabase_key = supabase_key or getattr(settings, "SUPABASE_KEY", "")
        self.bucket_name = bucket_name or getattr(
            settings, "SUPABASE_BUCKET_NAME", "real-estate-media"
        )
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        """Lazily initialize and return the Supabase client."""
        if not self._client:
            if not self.supabase_url or not self.supabase_key:
                raise ValueError(
                    "Supabase URL and API Key must be set in settings or passed explicitly."
                )
            self._client = create_client(self.supabase_url, self.supabase_key)
        return self._client

    def is_configured(self) -> bool:
        """Check whether Supabase configuration is present and valid."""
        if not self.supabase_url or not self.supabase_key:
            return False
        if self.supabase_url.startswith("https://mock-") or self.supabase_key.startswith("mock-"):
            return False
        if "your-supabase" in self.supabase_key or "your-project" in self.supabase_url:
            return False
        # Supabase anon and service_role keys are valid JWT tokens (starting with eyJ)
        if not self.supabase_key.startswith("eyJ"):
            return False
        return True

    def upload_file(
        self,
        file_path: str,
        file_content: Union[bytes, BinaryIO],
        content_type: Optional[str] = None,
        upsert: bool = False,
    ) -> dict:
        """
        Upload a file to Supabase Storage.

        :param file_path: Remote path inside bucket (e.g. 'properties/123/main.jpg')
        :param file_content: Binary content or file-like object
        :param content_type: MIME type of the file (e.g. 'image/jpeg', 'application/pdf')
        :param upsert: Whether to overwrite existing file at file_path
        :return: Response dictionary with path and public/signed URLs
        """
        clean_path = file_path.lstrip("/")
        
        if not self.is_configured():
            logger.warning(
                "Supabase Storage credentials not configured. Simulating upload for path: %s",
                clean_path,
            )
            return {
                "path": clean_path,
                "url": f"https://mock-storage.local/{self.bucket_name}/{clean_path}",
                "simulated": True,
            }

        try:
            file_options = {"upsert": "true" if upsert else "false"}
            if content_type:
                file_options["content-type"] = content_type

            # If file_content is bytes, pass directly; if it's a file-like object, read bytes
            if hasattr(file_content, "read"):
                data = file_content.read()
            else:
                data = file_content

            response = self.client.storage.from_(self.bucket_name).upload(
                path=clean_path,
                file=data,
                file_options=file_options,
            )
            public_url = self.get_public_url(clean_path)
            return {
                "path": clean_path,
                "url": public_url,
                "raw_response": response,
                "simulated": False,
            }
        except Exception as exc:
            logger.error("Failed to upload file to Supabase Storage: %s", exc)
            raise exc

    def get_public_url(self, file_path: str) -> str:
        """
        Retrieve the publicly accessible URL for a file in a public bucket.
        """
        clean_path = file_path.lstrip("/")
        if not self.is_configured():
            return f"https://mock-storage.local/{self.bucket_name}/{clean_path}"

        return self.client.storage.from_(self.bucket_name).get_public_url(clean_path)

    def create_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        """
        Generate a time-limited signed URL for private documents (e.g. contracts, KYC).
        :param file_path: Remote path inside bucket
        :param expires_in: Seconds until expiration (default: 1 hour)
        """
        clean_path = file_path.lstrip("/")
        if not self.is_configured():
            return f"https://mock-storage.local/{self.bucket_name}/{clean_path}?token=mock_signed_token_{expires_in}s"

        response = self.client.storage.from_(self.bucket_name).create_signed_url(
            clean_path, expires_in=expires_in
        )
        return response.get("signedURL", "")

    def delete_file(self, file_path: str) -> dict:
        """
        Delete a single file or multiple files from the storage bucket.
        """
        clean_path = file_path.lstrip("/")
        if not self.is_configured():
            return {"deleted": [clean_path], "simulated": True}

        response = self.client.storage.from_(self.bucket_name).remove([clean_path])
        return {"deleted": response, "simulated": False}


_storage_service_instance: Optional[SupabaseStorageService] = None


def get_storage_service() -> SupabaseStorageService:
    """Singleton getter for SupabaseStorageService."""
    global _storage_service_instance
    if _storage_service_instance is None:
        _storage_service_instance = SupabaseStorageService()
    return _storage_service_instance
