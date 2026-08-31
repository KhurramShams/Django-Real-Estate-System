import io
from PIL import Image
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import UserRole
from apps.properties.models import (
    Property,
    PropertyImage,
    Amenity,
    PropertyType,
    ListingType,
    SizeUnit,
    PropertyStatus,
)

User = get_user_model()


def generate_test_image_file():
    """Helper to create a small in-memory JPEG image for upload testing."""
    file = io.BytesIO()
    image = Image.new("RGB", (100, 100), color="blue")
    image.save(file, "JPEG")
    file.name = "test_living_room.jpg"
    file.seek(0)
    return file


class PropertyModelTests(TestCase):
    """Test Property model creation and business logic."""

    def setUp(self):
        self.amenity = Amenity.objects.create(
            name="Backup Generator", icon="zap", description="24/7 power backup"
        )

    def test_create_property_stores_manual_price(self):
        property_obj = Property.objects.create(
            title="Luxury 10 Marla Villa",
            description="Modern contemporary architecture in DHA",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Street 14, Sector J, Phase 6",
            city="Lahore",
            locality="DHA Phase 6",
            size=10.0,
            size_unit=SizeUnit.MARLA,
            price=25000000.0,
            owner_name="Chaudhry Aslam",
            owner_contact="+92-300-1234567",
        )
        property_obj.amenities.add(self.amenity)

        self.assertEqual(property_obj.price, 25000000.0)
        self.assertFalse(hasattr(property_obj, "price_per_unit"))
        self.assertTrue(property_obj.amenities.filter(name="Backup Generator").exists())
        self.assertEqual(
            str(property_obj),
            "Luxury 10 Marla Villa - Lahore (Residential, Available)",
        )

    def test_property_image_primary_flag_management(self):
        prop = Property.objects.create(
            title="Commercial Plaza",
            address="Main Boulevard",
            city="Karachi",
            locality="Clifton Block 2",
            size=500.0,
            size_unit=SizeUnit.SQ_YD,
            price=85000000.0,
            owner_name="Tariq Khan",
        )

        # Image 1 marked primary
        img1 = PropertyImage.objects.create(
            property=prop,
            image_url="https://mock-storage.local/media/img1.jpg",
            storage_path="properties/1/img1.jpg",
            is_primary=True,
        )
        self.assertTrue(img1.is_primary)
        self.assertEqual(prop.primary_image_url, "https://mock-storage.local/media/img1.jpg")

        # Image 2 marked primary -> should un-mark Image 1
        img2 = PropertyImage.objects.create(
            property=prop,
            image_url="https://mock-storage.local/media/img2.jpg",
            storage_path="properties/1/img2.jpg",
            is_primary=True,
        )
        img1.refresh_from_db()
        self.assertFalse(img1.is_primary)
        self.assertTrue(img2.is_primary)
        self.assertEqual(prop.primary_image_url, "https://mock-storage.local/media/img2.jpg")


class PropertyAPITests(APITestCase):
    """Test Property CRUD, RBAC, Filtering, Search, and Image Upload."""

    def setUp(self):
        # Create users with different roles
        self.admin = User.objects.create_user(
            email="admin@realty.com",
            password="AdminPassword123!",
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="User",
        )
        self.agent = User.objects.create_user(
            email="agent@realty.com",
            password="AgentPassword123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="User",
        )
        self.accountant = User.objects.create_user(
            email="accountant@realty.com",
            password="AccountantPass123!",
            role=UserRole.ACCOUNTANT,
            first_name="Finance",
            last_name="User",
        )
        self.staff = User.objects.create_user(
            email="staff@realty.com",
            password="StaffPass123!",
            role=UserRole.STAFF,
            first_name="Office",
            last_name="Staff",
        )

        self.amenity_parking = Amenity.objects.create(name="Covered Parking")
        self.amenity_pool = Amenity.objects.create(name="Swimming Pool")

        # Seed sample properties for filtering tests
        self.prop_karachi_avail = Property.objects.create(
            title="Seaview 3 Bed Apartment",
            description="Direct sea facing luxury apartment",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Beach Avenue, Clifton",
            city="Karachi",
            locality="Clifton Block 4",
            size=2200.0,
            size_unit=SizeUnit.SQ_FT,
            price=35000000.0,
            owner_name="Ahmed Raza",
            owner_contact="+92-321-1112233",
        )
        self.prop_karachi_avail.amenities.add(self.amenity_parking, self.amenity_pool)

        self.prop_karachi_sold = Property.objects.create(
            title="Commercial Corner Plot",
            description="Ideal for bank or flagship retail",
            property_type=PropertyType.COMMERCIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.SOLD,
            address="Khayaban-e-Ittehad",
            city="Karachi",
            locality="DHA Phase 6",
            size=500.0,
            size_unit=SizeUnit.SQ_YD,
            price=95000000.0,
            owner_name="Bilal Sheikh",
        )

        self.prop_lahore_rent = Property.objects.create(
            title="1 Kanal Furnished Bungalow for Rent",
            description="Full furnished house with basement",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.RENT,
            status=PropertyStatus.AVAILABLE,
            address="Street 9, Sector C",
            city="Lahore",
            locality="DHA Phase 5",
            size=1.0,
            size_unit=SizeUnit.KANAL,
            price=350000.0,
            owner_name="Zahid Mahmood",
        )

    def test_rbac_admin_can_create_property(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "title": "New 1 Kanal Executive Villa",
            "description": "Newly constructed brand new house",
            "property_type": "residential",
            "listing_type": "sale",
            "status": "available",
            "address": "Lane 12, Phase 7",
            "city": "Rawalpindi",
            "locality": "Bahria Town Phase 7",
            "size": 1.0,
            "size_unit": "kanal",
            "price": 48000000.0,
            "owner_name": "Hamza Malik",
            "owner_contact": "+92-333-5556677",
            "amenity_ids": [str(self.amenity_parking.id)],
        }
        response = self.client.post("/api/v1/properties/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New 1 Kanal Executive Villa")
        self.assertEqual(float(response.data["price"]), 48000000.0)
        self.assertNotIn("price_per_unit", response.data)

    def test_rbac_agent_can_create_and_update_property(self):
        self.client.force_authenticate(user=self.agent)
        payload = {
            "title": "Office Space for Rent in Blue Area",
            "property_type": "commercial",
            "listing_type": "rent",
            "status": "available",
            "address": "Jinnah Avenue",
            "city": "Islamabad",
            "locality": "Blue Area",
            "size": 1500.0,
            "size_unit": "sq_ft",
            "price": 250000.0,
            "owner_name": "Kamran Siddiqui",
        }
        create_resp = self.client.post("/api/v1/properties/", payload, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        prop_id = create_resp.data["id"]

        # Update price
        update_resp = self.client.patch(
            f"/api/v1/properties/{prop_id}/",
            {"price": 275000.0},
            format="json",
        )
        self.assertEqual(update_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(float(update_resp.data["price"]), 275000.0)

    def test_rbac_non_privileged_roles_rejected_on_write(self):
        # Accountant role attempting create
        self.client.force_authenticate(user=self.accountant)
        payload = {
            "title": "Unauthorized Listing Attempt",
            "address": "123 Street",
            "city": "Karachi",
            "locality": "DHA",
            "size": 10.0,
            "price": 1000000.0,
            "owner_name": "Test Owner",
        }
        response = self.client.post("/api/v1/properties/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Staff role attempting delete
        self.client.force_authenticate(user=self.staff)
        del_resp = self.client.delete(f"/api/v1/properties/{self.prop_karachi_avail.id}/")
        self.assertEqual(del_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_rbac_all_authenticated_users_can_read(self):
        for user in [self.admin, self.agent, self.accountant, self.staff]:
            self.client.force_authenticate(user=user)
            list_resp = self.client.get("/api/v1/properties/")
            self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
            self.assertNotIn("price_per_unit", list_resp.data["results"][0])
            detail_resp = self.client.get(f"/api/v1/properties/{self.prop_karachi_avail.id}/")
            self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
            self.assertNotIn("price_per_unit", detail_resp.data)

    def test_filter_by_status_and_city(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(
            "/api/v1/properties/?status=available&city=Karachi"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.prop_karachi_avail.id))

    def test_filter_by_price_range(self):
        self.client.force_authenticate(user=self.agent)
        # Price between 20,000,000 and 50,000,000 PKR
        response = self.client.get(
            "/api/v1/properties/?min_price=20000000&max_price=50000000"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(self.prop_karachi_avail.id))

    def test_search_by_keyword(self):
        self.client.force_authenticate(user=self.agent)
        response = self.client.get("/api/v1/properties/?search=Bungalow")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], self.prop_lahore_rent.title)

    def test_upload_property_image(self):
        self.client.force_authenticate(user=self.agent)
        image_file = generate_test_image_file()

        response = self.client.post(
            f"/api/v1/properties/{self.prop_karachi_avail.id}/upload-image/",
            {
                "image": image_file,
                "caption": "Spacious Living Hall with Sea View",
                "is_primary": True,
                "display_order": 1,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("image_url", response.data)
        self.assertIn("storage_path", response.data)
        self.assertTrue(response.data["is_primary"])
        self.assertEqual(response.data["caption"], "Spacious Living Hall with Sea View")

        # Verify image appears in property detail endpoint
        detail_resp = self.client.get(f"/api/v1/properties/{self.prop_karachi_avail.id}/")
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail_resp.data["images"]), 1)
        self.assertIsNotNone(detail_resp.data["primary_image_url"])

    def test_pagination_metadata_format(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/v1/properties/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("total_pages", response.data)
        self.assertIn("current_page", response.data)
        self.assertIn("page_size", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 3)
