from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import UserRole
from apps.properties.models import Property, PropertyType, ListingType, PropertyStatus, SizeUnit
from apps.clients.models import Client, ClientType, ClientSource
from apps.deals.models import Deal, DealType, DealStatus, CommissionStatus

User = get_user_model()


class DealModelBusinessLogicTests(TestCase):
    """Test Deal commission auto-calculation and property inventory synchronization."""

    def setUp(self):
        self.agent = User.objects.create_user(
            email="agent.deals@realty.com",
            password="Password123!",
            role=UserRole.AGENT,
            first_name="Fahad",
            last_name="Mustafa",
        )
        self.client = Client.objects.create(
            full_name="Asim Azhar",
            phone_number="+92-300-9988112",
            client_type=ClientType.BUYER,
            assigned_agent=self.agent,
        )
        self.property_sale = Property.objects.create(
            title="Luxury Sea View Apartment",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Clifton Block 2",
            city="Karachi",
            size=Decimal("2000.00"),
            size_unit=SizeUnit.SQ_FT,
            price=Decimal("40000000.00"),
        )
        self.property_rent = Property.objects.create(
            title="Commercial Office Space",
            property_type=PropertyType.COMMERCIAL,
            listing_type=ListingType.RENT,
            status=PropertyStatus.AVAILABLE,
            address="Blue Area",
            city="Islamabad",
            size=Decimal("1500.00"),
            size_unit=SizeUnit.SQ_FT,
            price=Decimal("350000.00"),
        )

    def test_commission_calculation(self):
        # Percentage provided -> calculates amount
        deal_pct = Deal.objects.create(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            agreed_price=Decimal("40000000.00"),
            commission_percentage=Decimal("1.50"),
        )
        self.assertEqual(deal_pct.commission_amount, Decimal("600000.00"))

        # Amount provided -> calculates percentage
        deal_amt = Deal.objects.create(
            property=self.property_rent,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.RENT,
            agreed_price=Decimal("350000.00"),
            commission_amount=Decimal("35000.00"),
        )
        self.assertEqual(deal_amt.commission_percentage, Decimal("10.00"))

    def test_commission_percentage_precedence_over_mismatched_amount(self):
        # Both sent with mismatched amount -> percentage overwrites amount
        deal = Deal.objects.create(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            agreed_price=Decimal("50000000.00"),
            commission_percentage=Decimal("2.00"),
            commission_amount=Decimal("50000.00"),  # Mismatched amount
        )
        self.assertEqual(deal.commission_amount, Decimal("1000000.00"))
        self.assertEqual(deal.commission_percentage, Decimal("2.00"))

    def test_agreed_price_change_recalculates_commission_amount(self):
        # Create with commission_amount only -> derives 1.5%
        deal = Deal.objects.create(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            agreed_price=Decimal("10000000.00"),
            commission_amount=Decimal("150000.00"),
        )
        self.assertEqual(deal.commission_percentage, Decimal("1.50"))
        self.assertEqual(deal.commission_amount, Decimal("150000.00"))

        # Update agreed_price -> automatically recalculates commission_amount to 300,000
        deal.agreed_price = Decimal("20000000.00")
        deal.save()
        self.assertEqual(deal.commission_amount, Decimal("300000.00"))
        self.assertEqual(deal.commission_percentage, Decimal("1.50"))

    def test_deal_completion_marks_property_sold(self):
        deal = Deal.objects.create(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            deal_status=DealStatus.IN_PROGRESS,
            agreed_price=Decimal("40000000.00"),
        )
        self.property_sale.refresh_from_db()
        self.assertEqual(self.property_sale.status, PropertyStatus.UNDER_NEGOTIATION)

        deal.deal_status = DealStatus.COMPLETED
        deal.save()
        self.property_sale.refresh_from_db()
        self.assertEqual(self.property_sale.status, PropertyStatus.SOLD)

    def test_deal_completion_marks_property_rented(self):
        deal = Deal.objects.create(
            property=self.property_rent,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.RENT,
            deal_status=DealStatus.COMPLETED,
            agreed_price=Decimal("350000.00"),
        )
        self.property_rent.refresh_from_db()
        self.assertEqual(self.property_rent.status, PropertyStatus.RENTED)

    def test_deal_cancellation_reverts_to_available_when_no_other_active_deal(self):
        deal = Deal.objects.create(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            deal_status=DealStatus.NEGOTIATION,
            agreed_price=Decimal("40000000.00"),
        )
        self.property_sale.refresh_from_db()
        self.assertEqual(self.property_sale.status, PropertyStatus.UNDER_NEGOTIATION)

        deal.deal_status = DealStatus.CANCELLED
        deal.save()
        self.property_sale.refresh_from_db()
        self.assertEqual(self.property_sale.status, PropertyStatus.AVAILABLE)

    def test_deal_cancellation_safeguard_with_another_active_deal(self):
        # Deal 1 is active
        deal1 = Deal.objects.create(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            deal_status=DealStatus.IN_PROGRESS,
            agreed_price=Decimal("40000000.00"),
        )
        # Create Deal 2 as in_progress directly in DB for the test scenario
        deal2 = Deal(
            property=self.property_sale,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            deal_status=DealStatus.NEGOTIATION,
            agreed_price=Decimal("39000000.00"),
        )
        deal2.save()

        # Cancel Deal 2
        deal2.deal_status = DealStatus.CANCELLED
        deal2.save()

        # Property should NOT revert to available because Deal 1 is still active
        self.property_sale.refresh_from_db()
        self.assertEqual(self.property_sale.status, PropertyStatus.UNDER_NEGOTIATION)


class DealAPITests(APITestCase):
    """Test Deal API endpoints, validation, RBAC, Agent isolation, and Accountant permissions."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin.deal@agency.com",
            password="AdminPass123!",
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="Boss",
        )
        self.agent_a = User.objects.create_user(
            email="agent.a.deal@agency.com",
            password="AgentPass123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="One",
        )
        self.agent_b = User.objects.create_user(
            email="agent.b.deal@agency.com",
            password="AgentPass123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="Two",
        )
        self.accountant = User.objects.create_user(
            email="accountant.deal@agency.com",
            password="AccountantPass123!",
            role=UserRole.ACCOUNTANT,
            first_name="Finance",
            last_name="Chief",
        )
        self.staff = User.objects.create_user(
            email="staff.deal@agency.com",
            password="StaffPass123!",
            role=UserRole.STAFF,
            first_name="Staff",
            last_name="Support",
        )

        self.client_a = Client.objects.create(
            full_name="Naveed Sheikh",
            phone_number="+92-300-4455661",
            client_type=ClientType.BUYER,
            assigned_agent=self.agent_a,
        )
        self.client_b = Client.objects.create(
            full_name="Rashid Latif",
            phone_number="+92-321-7788992",
            client_type=ClientType.BUYER,
            assigned_agent=self.agent_b,
        )

        self.property_1 = Property.objects.create(
            title="DHA Phase 5 Villa",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Street 14, Phase 5",
            city="Karachi",
            size=Decimal("500.00"),
            size_unit=SizeUnit.SQ_YD,
            price=Decimal("85000000.00"),
        )
        self.property_2 = Property.objects.create(
            title="Gulberg Office Space",
            property_type=PropertyType.COMMERCIAL,
            listing_type=ListingType.RENT,
            status=PropertyStatus.AVAILABLE,
            address="Main Boulevard",
            city="Lahore",
            size=Decimal("1200.00"),
            size_unit=SizeUnit.SQ_FT,
            price=Decimal("200000.00"),
        )

        self.deal_a = Deal.objects.create(
            property=self.property_1,
            client=self.client_a,
            agent=self.agent_a,
            deal_type=DealType.SALE,
            deal_status=DealStatus.NEGOTIATION,
            agreed_price=Decimal("85000000.00"),
            commission_percentage=Decimal("1.00"),
        )

    def test_agent_creates_deal_auto_assigns_self(self):
        self.client.force_authenticate(user=self.agent_b)
        payload = {
            "property": str(self.property_2.id),
            "client": str(self.client_b.id),
            "deal_type": "rent",
            "deal_status": "booked",
            "agreed_price": "200000.00",
            "booking_amount": "50000.00",
            "commission_percentage": "10.00",
            "is_installment": True,
            "number_of_installments": 12,
            "installment_frequency": "monthly",
        }
        resp = self.client.post("/api/v1/deals/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["agent"], self.agent_b.id)
        self.assertEqual(resp.data["deal_status"], "booked")

    def test_prevent_duplicate_active_deal_on_same_property(self):
        self.client.force_authenticate(user=self.agent_b)
        # property_1 already has deal_a in negotiation
        payload = {
            "property": str(self.property_1.id),
            "client": str(self.client_b.id),
            "deal_type": "sale",
            "deal_status": "in_progress",
            "agreed_price": "84000000.00",
        }
        resp = self.client.post("/api/v1/deals/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("property", resp.data)
        self.assertIn("active deal in progress", str(resp.data["property"][0]))

    def test_prevent_deal_type_mismatch_with_property_listing_type(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "property": str(self.property_2.id),  # listing_type is rent
            "client": str(self.client_a.id),
            "deal_type": "sale",  # mismatched deal_type
            "agreed_price": "5000000.00",
        }
        resp = self.client.post("/api/v1/deals/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deal_type", resp.data)

    def test_agent_isolation_and_admin_full_access(self):
        # Agent B lists deals -> only sees own deals (none yet)
        self.client.force_authenticate(user=self.agent_b)
        list_resp_b = self.client.get("/api/v1/deals/")
        self.assertEqual(list_resp_b.status_code, status.HTTP_200_OK)
        self.assertEqual(list_resp_b.data["count"], 0)

        # Agent B cannot retrieve Agent A's deal
        get_resp = self.client.get(f"/api/v1/deals/{self.deal_a.id}/")
        self.assertEqual(get_resp.status_code, status.HTTP_404_NOT_FOUND)

        # Admin lists deals -> sees all deals
        self.client.force_authenticate(user=self.admin)
        list_resp_admin = self.client.get("/api/v1/deals/")
        self.assertEqual(list_resp_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(list_resp_admin.data["count"], 1)

    def test_accountant_commission_status_write_and_restrictions(self):
        self.client.force_authenticate(user=self.accountant)

        # Accountant can read all deals
        read_resp = self.client.get("/api/v1/deals/")
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(read_resp.data["count"], 1)

        # Accountant can update commission_status
        patch_comm = self.client.patch(
            f"/api/v1/deals/{self.deal_a.id}/",
            {"commission_status": "paid"},
            format="json",
        )
        self.assertEqual(patch_comm.status_code, status.HTTP_200_OK)
        self.deal_a.refresh_from_db()
        self.assertEqual(self.deal_a.commission_status, CommissionStatus.PAID)

        # Accountant attempting to modify agreed_price is rejected (403 Forbidden)
        patch_price = self.client.patch(
            f"/api/v1/deals/{self.deal_a.id}/",
            {"agreed_price": "99999999.00"},
            format="json",
        )
        self.assertEqual(patch_price.status_code, status.HTTP_403_FORBIDDEN)

        # Accountant cannot create deals (403 Forbidden)
        post_resp = self.client.post(
            "/api/v1/deals/",
            {"agreed_price": "50000.00"},
            format="json",
        )
        self.assertEqual(post_resp.status_code, status.HTTP_403_FORBIDDEN)

        # Accountant cannot delete deals (403 Forbidden)
        del_resp = self.client.delete(f"/api/v1/deals/{self.deal_a.id}/")
        self.assertEqual(del_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_read_only(self):
        self.client.force_authenticate(user=self.staff)

        # Read succeeds
        read_resp = self.client.get("/api/v1/deals/")
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)

        # Write fails (403 Forbidden)
        patch_resp = self.client.patch(
            f"/api/v1/deals/{self.deal_a.id}/",
            {"commission_status": "paid"},
            format="json",
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_filtering_and_search(self):
        self.client.force_authenticate(user=self.admin)

        # Filter by deal_status=negotiation
        filter_resp = self.client.get("/api/v1/deals/?deal_status=negotiation")
        self.assertEqual(filter_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(filter_resp.data["count"], 1)

        # Search by property title
        search_resp = self.client.get("/api/v1/deals/?search=Villa")
        self.assertEqual(search_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(search_resp.data["count"], 1)
        self.assertEqual(search_resp.data["results"][0]["property_title"], "DHA Phase 5 Villa")

        # Search by client name
        search_client = self.client.get("/api/v1/deals/?search=Naveed")
        self.assertEqual(search_client.status_code, status.HTTP_200_OK)
        self.assertEqual(search_client.data["count"], 1)
        self.assertEqual(search_client.data["results"][0]["client_name"], "Naveed Sheikh")

    def test_api_commission_percentage_precedence_over_mismatched_amount(self):
        self.client.force_authenticate(user=self.admin)
        # Create a new property for this test
        test_prop = Property.objects.create(
            title="Gulberg Commercial Plaza",
            property_type=PropertyType.COMMERCIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Main Gulberg",
            city="Lahore",
            size=Decimal("3000.00"),
            size_unit=SizeUnit.SQ_FT,
            price=Decimal("50000000.00"),
        )
        payload = {
            "property": str(test_prop.id),
            "client": str(self.client_a.id),
            "deal_type": "sale",
            "deal_status": "negotiation",
            "agreed_price": "50000000.00",
            "commission_percentage": "2.00",
            "commission_amount": "50000.00",  # Mismatched amount sent in request
        }
        resp = self.client.post("/api/v1/deals/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # Commission amount overwritten to 1,000,000.00 (2% of 50M)
        self.assertEqual(Decimal(str(resp.data["commission_amount"])), Decimal("1000000.00"))
        self.assertEqual(Decimal(str(resp.data["commission_percentage"])), Decimal("2.00"))

    def test_api_initial_creation_with_only_commission_amount(self):
        self.client.force_authenticate(user=self.admin)
        test_prop = Property.objects.create(
            title="DHA Phase 8 Plot",
            property_type=PropertyType.PLOT,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Sector Z",
            city="Lahore",
            size=Decimal("500.00"),
            size_unit=SizeUnit.SQ_YD,
            price=Decimal("30000000.00"),
        )
        payload = {
            "property": str(test_prop.id),
            "client": str(self.client_a.id),
            "deal_type": "sale",
            "deal_status": "negotiation",
            "agreed_price": "30000000.00",
            "commission_amount": "600000.00",  # Only commission_amount sent
        }
        resp = self.client.post("/api/v1/deals/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        # Commission percentage derived as 2.00%
        self.assertEqual(Decimal(str(resp.data["commission_percentage"])), Decimal("2.00"))
        self.assertEqual(Decimal(str(resp.data["commission_amount"])), Decimal("600000.00"))

    def test_api_update_agreed_price_recalculates_commission_amount(self):
        self.client.force_authenticate(user=self.admin)
        # deal_a had agreed_price=85,000,000 and commission_percentage=1.00 (commission_amount=850,000)
        patch_payload = {
            "agreed_price": "100000000.00",  # Updated to 100M without resending commission_percentage
        }
        resp = self.client.patch(
            f"/api/v1/deals/{self.deal_a.id}/",
            patch_payload,
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Commission amount automatically recalculated to 1,000,000.00 (1% of 100M)
        self.assertEqual(Decimal(str(resp.data["commission_amount"])), Decimal("1000000.00"))
        self.assertEqual(Decimal(str(resp.data["commission_percentage"])), Decimal("1.00"))

    def test_pagination_metadata(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get("/api/v1/deals/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("count", resp.data)
        self.assertIn("total_pages", resp.data)
        self.assertIn("current_page", resp.data)
        self.assertIn("page_size", resp.data)
        self.assertIn("results", resp.data)
