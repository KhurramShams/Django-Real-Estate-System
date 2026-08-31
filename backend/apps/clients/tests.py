from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import UserRole
from apps.clients.models import Client, ClientType, ClientSource
from apps.properties.models import PropertyType, ListingType

User = get_user_model()


class ClientModelTests(TestCase):
    """Test Client model creation and string representation."""

    def setUp(self):
        self.agent = User.objects.create_user(
            email="agent.test@realty.com",
            password="Password123!",
            role=UserRole.AGENT,
            first_name="Bilal",
            last_name="Khan",
        )

    def test_create_client_with_preferences(self):
        client = Client.objects.create(
            full_name="Muhammad Usman",
            phone_number="+92-300-1122334",
            email="usman@example.com",
            cnic="42101-1234567-1",
            client_type=ClientType.BUYER,
            source=ClientSource.REFERRAL,
            preferred_property_type=PropertyType.RESIDENTIAL,
            preferred_listing_type=ListingType.SALE,
            budget_min=30000000.0,
            budget_max=45000000.0,
            preferred_city="Karachi",
            preferred_locality="DHA Phase 6",
            assigned_agent=self.agent,
            notes="Looking for 500 sq yd corner plot or bungalow.",
        )
        self.assertEqual(client.full_name, "Muhammad Usman")
        self.assertEqual(client.client_type, ClientType.BUYER)
        self.assertEqual(client.cnic, "42101-1234567-1")
        self.assertEqual(client.assigned_agent, self.agent)
        self.assertEqual(str(client), "Muhammad Usman (Buyer) - Agent: Bilal Khan")


class ClientAPITests(APITestCase):
    """Test Client CRUD, RBAC, Agent QuerySet Scoping, Filtering, and Search."""

    def setUp(self):
        # Create users for all roles
        self.admin = User.objects.create_user(
            email="admin@agency.com",
            password="AdminPass123!",
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="Director",
        )
        self.agent_a = User.objects.create_user(
            email="agent.a@agency.com",
            password="AgentPass123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="Alpha",
        )
        self.agent_b = User.objects.create_user(
            email="agent.b@agency.com",
            password="AgentPass123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="Bravo",
        )
        self.accountant = User.objects.create_user(
            email="accountant@agency.com",
            password="AccountantPass123!",
            role=UserRole.ACCOUNTANT,
            first_name="Finance",
            last_name="Officer",
        )
        self.staff = User.objects.create_user(
            email="staff@agency.com",
            password="StaffPass123!",
            role=UserRole.STAFF,
            first_name="Front",
            last_name="Desk",
        )

        # Seed sample clients
        self.client_a = Client.objects.create(
            full_name="Tariq Mansoor",
            phone_number="+92-321-9988771",
            email="tariq@client.com",
            cnic="42201-1122334-5",
            client_type=ClientType.BUYER,
            source=ClientSource.PORTAL_ZAMEEN,
            preferred_city="Karachi",
            budget_min=20000000.0,
            budget_max=35000000.0,
            assigned_agent=self.agent_a,
        )

        self.client_b = Client.objects.create(
            full_name="Shahid Afridi",
            phone_number="+92-333-4455667",
            email="shahid@client.com",
            client_type=ClientType.SELLER,
            source=ClientSource.REFERRAL,
            preferred_city="Lahore",
            budget_max=90000000.0,
            assigned_agent=self.agent_b,
        )

    def test_admin_can_create_and_view_all_clients(self):
        self.client.force_authenticate(user=self.admin)

        # Create client
        payload = {
            "full_name": "Hamza Ali",
            "phone_number": "+92-300-5544332",
            "email": "hamza@client.com",
            "client_type": "tenant",
            "source": "walk_in",
            "preferred_city": "Islamabad",
            "budget_max": 250000.0,
        }
        create_resp = self.client.post("/api/v1/clients/", payload, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_resp.data["full_name"], "Hamza Ali")

        # Admin lists all clients -> sees client_a, client_b, and newly created client
        list_resp = self.client.get("/api/v1/clients/")
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(list_resp.data["count"], 3)

    def test_agent_creates_client_auto_assigns_self(self):
        self.client.force_authenticate(user=self.agent_a)
        payload = {
            "full_name": "Daniyal Aziz",
            "phone_number": "+92-301-7766554",
            "client_type": "landlord",
            "source": "direct_call",
            "preferred_city": "Karachi",
        }
        resp = self.client.post("/api/v1/clients/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["assigned_agent"], self.agent_a.id)

    def test_agent_queryset_scoping_isolation(self):
        # Agent A lists clients -> only sees client_a
        self.client.force_authenticate(user=self.agent_a)
        resp_a = self.client.get("/api/v1/clients/")
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_a.data["count"], 1)
        self.assertEqual(resp_a.data["results"][0]["id"], str(self.client_a.id))

        # Agent A attempts to retrieve client_b -> 404 Not Found
        retrieve_resp = self.client.get(f"/api/v1/clients/{self.client_b.id}/")
        self.assertEqual(retrieve_resp.status_code, status.HTTP_404_NOT_FOUND)

        # Agent A attempts to update client_b -> 404 Not Found
        update_resp = self.client.patch(
            f"/api/v1/clients/{self.client_b.id}/",
            {"full_name": "Hacked Name"},
            format="json",
        )
        self.assertEqual(update_resp.status_code, status.HTTP_404_NOT_FOUND)

        # Agent B lists clients -> only sees client_b
        self.client.force_authenticate(user=self.agent_b)
        resp_b = self.client.get("/api/v1/clients/")
        self.assertEqual(resp_b.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_b.data["count"], 1)
        self.assertEqual(resp_b.data["results"][0]["id"], str(self.client_b.id))

    def test_agent_cannot_reassign_client_on_update(self):
        """When an AGENT sends a PATCH with assigned_agent, it is ignored."""
        self.client.force_authenticate(user=self.agent_a)
        patch_payload = {
            "full_name": "Tariq Mansoor Updated",
            "assigned_agent": str(self.agent_b.id),
        }
        resp = self.client.patch(
            f"/api/v1/clients/{self.client_a.id}/",
            patch_payload,
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.client_a.refresh_from_db()
        # Name is updated, but assigned_agent remains agent_a
        self.assertEqual(self.client_a.full_name, "Tariq Mansoor Updated")
        self.assertEqual(self.client_a.assigned_agent, self.agent_a)

    def test_admin_can_reassign_client(self):
        """ADMIN can freely change assigned_agent on any client."""
        self.client.force_authenticate(user=self.admin)
        patch_payload = {
            "assigned_agent": str(self.agent_b.id),
        }
        resp = self.client.patch(
            f"/api/v1/clients/{self.client_a.id}/",
            patch_payload,
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.client_a.refresh_from_db()
        self.assertEqual(self.client_a.assigned_agent, self.agent_b)

    def test_accountant_and_staff_read_only_access(self):
        for user in [self.accountant, self.staff]:
            self.client.force_authenticate(user=user)

            # Can read list (sees all clients)
            list_resp = self.client.get("/api/v1/clients/")
            self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
            self.assertEqual(list_resp.data["count"], 2)

            # Can retrieve detail
            detail_resp = self.client.get(f"/api/v1/clients/{self.client_a.id}/")
            self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)

            # Cannot create (403 Forbidden)
            create_resp = self.client.post(
                "/api/v1/clients/",
                {"full_name": "Forbidden Client", "phone_number": "123"},
                format="json",
            )
            self.assertEqual(create_resp.status_code, status.HTTP_403_FORBIDDEN)

            # Cannot update (403 Forbidden)
            update_resp = self.client.patch(
                f"/api/v1/clients/{self.client_a.id}/",
                {"full_name": "Updated Name"},
                format="json",
            )
            self.assertEqual(update_resp.status_code, status.HTTP_403_FORBIDDEN)

            # Cannot delete (403 Forbidden)
            del_resp = self.client.delete(f"/api/v1/clients/{self.client_a.id}/")
            self.assertEqual(del_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_by_client_type(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get("/api/v1/clients/?client_type=buyer")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["id"], str(self.client_a.id))

    def test_search_by_phone_number_and_name(self):
        self.client.force_authenticate(user=self.admin)

        # Search by phone number
        resp_phone = self.client.get("/api/v1/clients/?search=9988771")
        self.assertEqual(resp_phone.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_phone.data["count"], 1)
        self.assertEqual(resp_phone.data["results"][0]["full_name"], "Tariq Mansoor")

        # Search by name
        resp_name = self.client.get("/api/v1/clients/?search=Afridi")
        self.assertEqual(resp_name.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_name.data["count"], 1)
        self.assertEqual(resp_name.data["results"][0]["full_name"], "Shahid Afridi")

    def test_pagination_metadata(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get("/api/v1/clients/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("count", resp.data)
        self.assertIn("total_pages", resp.data)
        self.assertIn("current_page", resp.data)
        self.assertIn("page_size", resp.data)
        self.assertIn("results", resp.data)
        self.assertEqual(resp.data["count"], 2)
