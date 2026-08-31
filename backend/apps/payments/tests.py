import datetime
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import UserRole
from apps.properties.models import Property, PropertyType, ListingType, PropertyStatus, SizeUnit
from apps.clients.models import Client, ClientType
from apps.deals.models import Deal, DealType, DealStatus, InstallmentFrequency
from apps.payments.models import Payment, PaymentStatus, PaymentMethod
from apps.payments.utils import add_months, generate_deal_installment_plan

User = get_user_model()


class PaymentModelBusinessLogicTests(TestCase):
    """Test Payment model partial payment logic, overdue calculation, and plan generator."""

    def setUp(self):
        self.agent = User.objects.create_user(
            email="agent.pay@realty.com",
            password="Password123!",
            role=UserRole.AGENT,
            first_name="Taimoor",
            last_name="Salahuddin",
        )
        self.client = Client.objects.create(
            full_name="Ali Zafar",
            phone_number="+92-300-1234567",
            client_type=ClientType.BUYER,
            assigned_agent=self.agent,
        )
        self.property = Property.objects.create(
            title="DHA Phase 5 Luxury Villa",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.UNDER_NEGOTIATION,
            address="Khayaban-e-Mujahid",
            city="Karachi",
            size=Decimal("500.00"),
            size_unit=SizeUnit.SQ_YD,
            price=Decimal("90000000.00"),
        )
        self.deal = Deal.objects.create(
            property=self.property,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            deal_status=DealStatus.BOOKED,
            agreed_price=Decimal("90000000.00"),
            booking_amount=Decimal("15000000.00"),
            is_installment=True,
            number_of_installments=5,
            installment_frequency=InstallmentFrequency.QUARTERLY,
            deal_date=datetime.date(2026, 1, 1),
        )

    def test_installment_plan_generator_math_and_dates(self):
        payments = generate_deal_installment_plan(self.deal)
        self.assertEqual(len(payments), 5)

        # Net balance = 90M - 15M = 75M
        # 75M / 5 = 15M per installment
        total_amount = sum(p.amount for p in payments)
        self.assertEqual(total_amount, Decimal("75000000.00"))
        self.assertEqual(payments[0].amount, Decimal("15000000.00"))
        self.assertEqual(payments[4].amount, Decimal("15000000.00"))

        # Due dates spaced quarterly (+3 months)
        self.assertEqual(payments[0].due_date, datetime.date(2026, 4, 1))
        self.assertEqual(payments[1].due_date, datetime.date(2026, 7, 1))
        self.assertEqual(payments[2].due_date, datetime.date(2026, 10, 1))
        self.assertEqual(payments[3].due_date, datetime.date(2027, 1, 1))
        self.assertEqual(payments[4].due_date, datetime.date(2027, 4, 1))

    def test_installment_plan_remainder_absorption(self):
        # 100,000 split across 3 installments -> 33,333.33 + 33,333.33 + 33,333.34 = 100,000.00
        odd_deal = Deal.objects.create(
            property=self.property,
            client=self.client,
            agent=self.agent,
            deal_type=DealType.SALE,
            deal_status=DealStatus.NEGOTIATION,
            agreed_price=Decimal("100000.00"),
            booking_amount=Decimal("0.00"),
            is_installment=True,
            number_of_installments=3,
            installment_frequency=InstallmentFrequency.MONTHLY,
            deal_date=datetime.date(2026, 1, 15),
        )
        odd_payments = generate_deal_installment_plan(odd_deal)
        self.assertEqual(len(odd_payments), 3)
        self.assertEqual(odd_payments[0].amount, Decimal("33333.33"))
        self.assertEqual(odd_payments[1].amount, Decimal("33333.33"))
        self.assertEqual(odd_payments[2].amount, Decimal("33333.34"))
        self.assertEqual(sum(p.amount for p in odd_payments), Decimal("100000.00"))

    def test_payment_status_transitions_and_partial_logic(self):
        payment = Payment.objects.create(
            deal=self.deal,
            amount=Decimal("1000000.00"),
            due_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.assertEqual(payment.payment_status, PaymentStatus.PENDING)
        self.assertEqual(payment.remaining_balance, Decimal("1000000.00"))

        # Partial payment
        payment.amount_paid = Decimal("400000.00")
        payment.save()
        self.assertEqual(payment.payment_status, PaymentStatus.PARTIAL)
        self.assertEqual(payment.effective_status, PaymentStatus.PARTIAL)
        self.assertEqual(payment.remaining_balance, Decimal("600000.00"))

        # Full payment
        payment.amount_paid = Decimal("1000000.00")
        payment.save()
        self.assertEqual(payment.payment_status, PaymentStatus.PAID)
        self.assertEqual(payment.effective_status, PaymentStatus.PAID)
        self.assertEqual(payment.remaining_balance, Decimal("0.00"))
        self.assertIsNotNone(payment.paid_date)

    def test_overdue_and_partial_overdue_computation(self):
        past_date = timezone.localdate() - datetime.timedelta(days=10)
        future_date = timezone.localdate() + datetime.timedelta(days=10)

        # 1. Untouched and past due -> 'overdue'
        overdue_payment = Payment.objects.create(
            deal=self.deal,
            amount=Decimal("500000.00"),
            amount_paid=Decimal("0.00"),
            due_date=past_date,
            payment_status=PaymentStatus.PENDING,
        )
        self.assertTrue(overdue_payment.is_overdue)
        self.assertEqual(overdue_payment.effective_status, "overdue")

        # 2. Partially paid and past due -> 'partial_overdue'
        partial_overdue_payment = Payment.objects.create(
            deal=self.deal,
            amount=Decimal("500000.00"),
            amount_paid=Decimal("200000.00"),
            due_date=past_date,
            payment_status=PaymentStatus.PARTIAL,
        )
        self.assertTrue(partial_overdue_payment.is_overdue)
        self.assertEqual(partial_overdue_payment.effective_status, "partial_overdue")

        # 3. Partially paid and future due -> 'partial'
        partial_future_payment = Payment.objects.create(
            deal=self.deal,
            amount=Decimal("500000.00"),
            amount_paid=Decimal("200000.00"),
            due_date=future_date,
            payment_status=PaymentStatus.PARTIAL,
        )
        self.assertFalse(partial_future_payment.is_overdue)
        self.assertEqual(partial_future_payment.effective_status, "partial")


class PaymentAPITests(APITestCase):
    """Test Payment CRUD, Receipt Endpoint, Plan Generation API, and RBAC rules."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin.pay@agency.com",
            password="AdminPass123!",
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="Manager",
        )
        self.accountant = User.objects.create_user(
            email="accountant.pay@agency.com",
            password="AccountantPass123!",
            role=UserRole.ACCOUNTANT,
            first_name="Finance",
            last_name="Lead",
        )
        self.agent_a = User.objects.create_user(
            email="agent.a.pay@agency.com",
            password="AgentPass123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="Alpha",
        )
        self.agent_b = User.objects.create_user(
            email="agent.b.pay@agency.com",
            password="AgentPass123!",
            role=UserRole.AGENT,
            first_name="Agent",
            last_name="Bravo",
        )
        self.staff = User.objects.create_user(
            email="staff.pay@agency.com",
            password="StaffPass123!",
            role=UserRole.STAFF,
            first_name="Staff",
            last_name="Desk",
        )

        self.property = Property.objects.create(
            title="Bahria Town Heights",
            property_type=PropertyType.RESIDENTIAL,
            listing_type=ListingType.SALE,
            status=PropertyStatus.AVAILABLE,
            address="Commercial Sector",
            city="Islamabad",
            size=Decimal("1200.00"),
            size_unit=SizeUnit.SQ_FT,
            price=Decimal("24000000.00"),
        )
        self.client_a = Client.objects.create(
            full_name="Bilal Saeed",
            phone_number="+92-300-8899001",
            client_type=ClientType.BUYER,
            assigned_agent=self.agent_a,
        )

        self.deal_installment = Deal.objects.create(
            property=self.property,
            client=self.client_a,
            agent=self.agent_a,
            deal_type=DealType.SALE,
            deal_status=DealStatus.BOOKED,
            agreed_price=Decimal("24000000.00"),
            booking_amount=Decimal("4000000.00"),
            is_installment=True,
            number_of_installments=4,
            installment_frequency=InstallmentFrequency.QUARTERLY,
            deal_date=timezone.localdate(),
        )

        self.deal_onetime = Deal.objects.create(
            property=self.property,
            client=self.client_a,
            agent=self.agent_a,
            deal_type=DealType.SALE,
            deal_status=DealStatus.COMPLETED,
            agreed_price=Decimal("5000000.00"),
            is_installment=False,
        )

    def test_generate_installment_plan_endpoint(self):
        self.client.force_authenticate(user=self.accountant)
        url = f"/api/v1/deals/{self.deal_installment.id}/generate-installment-plan/"
        resp = self.client.post(url, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resp.data["installments"]), 4)
        self.assertEqual(resp.data["total_scheduled_amount"], "20000000.00")

    def test_generate_plan_rejected_on_non_installment_deal(self):
        self.client.force_authenticate(user=self.accountant)
        url = f"/api/v1/deals/{self.deal_onetime.id}/generate-installment-plan/"
        resp = self.client.post(url, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not configured as an installment deal", resp.data["error"])

    def test_regenerate_plan_safeguards(self):
        # Generate initial plan
        self.client.force_authenticate(user=self.accountant)
        url = f"/api/v1/deals/{self.deal_installment.id}/generate-installment-plan/"
        resp1 = self.client.post(url, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Attempt regenerate without force -> 400
        resp_no_force = self.client.post(url, format="json")
        self.assertEqual(resp_no_force.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Payments already exist", resp_no_force.data["error"])

        # Attempt regenerate with force=True as Accountant (non-Admin) -> 403
        resp_acc_force = self.client.post(url, {"force": True}, format="json")
        self.assertEqual(resp_acc_force.status_code, status.HTTP_403_FORBIDDEN)

        # Regenerate with force=True as Admin -> 201
        self.client.force_authenticate(user=self.admin)
        resp_admin_force = self.client.post(url, {"force": True}, format="json")
        self.assertEqual(resp_admin_force.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(resp_admin_force.data["installments"]), 4)

    def test_receipt_data_endpoint(self):
        self.client.force_authenticate(user=self.accountant)
        payment = Payment.objects.create(
            deal=self.deal_installment,
            amount=Decimal("5000000.00"),
            amount_paid=Decimal("5000000.00"),
            due_date=timezone.localdate(),
            paid_date=timezone.localdate(),
            payment_status=PaymentStatus.PAID,
            payment_method=PaymentMethod.BANK_TRANSFER,
            transaction_reference="HBL-TXN-998822",
            installment_number=1,
            total_installments=4,
        )
        receipt_url = f"/api/v1/payments/{payment.id}/receipt/"
        resp = self.client.get(receipt_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        self.assertIn("receipt_number", data)
        self.assertEqual(data["receipt_number"], f"REC-{str(payment.id)[:8].upper()}-1")
        self.assertEqual(data["amount"], "5000000.00")
        self.assertEqual(data["amount_paid"], "5000000.00")
        self.assertEqual(data["payment_method"], "bank_transfer")
        self.assertEqual(data["transaction_reference"], "HBL-TXN-998822")
        self.assertEqual(data["deal"]["id"], str(self.deal_installment.id))
        self.assertEqual(data["property"]["title"], "Bahria Town Heights")
        self.assertEqual(data["client"]["full_name"], "Bilal Saeed")
        self.assertEqual(data["agent"]["full_name"], "Agent Alpha")

    def test_rbac_accountant_full_write_and_agent_read_only_scoping(self):
        payment = Payment.objects.create(
            deal=self.deal_installment,
            amount=Decimal("5000000.00"),
            due_date=timezone.localdate() + datetime.timedelta(days=15),
        )

        # Accountant can update payment
        self.client.force_authenticate(user=self.accountant)
        patch_resp = self.client.patch(
            f"/api/v1/payments/{payment.id}/",
            {"amount_paid": "2000000.00", "transaction_reference": "CHEQUE#1002"},
            format="json",
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_resp.data["payment_status"], "partial")

        # Agent A (assigned agent) can read
        self.client.force_authenticate(user=self.agent_a)
        get_resp = self.client.get(f"/api/v1/payments/{payment.id}/")
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)

        # Agent A cannot write (403)
        agent_patch = self.client.patch(
            f"/api/v1/payments/{payment.id}/",
            {"amount_paid": "5000000.00"},
            format="json",
        )
        self.assertEqual(agent_patch.status_code, status.HTTP_403_FORBIDDEN)

        # Agent B (not assigned) cannot view (404)
        self.client.force_authenticate(user=self.agent_b)
        get_b = self.client.get(f"/api/v1/payments/{payment.id}/")
        self.assertEqual(get_b.status_code, status.HTTP_404_NOT_FOUND)

        # Staff can read but cannot write
        self.client.force_authenticate(user=self.staff)
        get_staff = self.client.get(f"/api/v1/payments/{payment.id}/")
        self.assertEqual(get_staff.status_code, status.HTTP_200_OK)
        staff_patch = self.client.patch(
            f"/api/v1/payments/{payment.id}/",
            {"amount_paid": "5000000.00"},
            format="json",
        )
        self.assertEqual(staff_patch.status_code, status.HTTP_403_FORBIDDEN)

    def test_payment_filters_and_pagination(self):
        self.client.force_authenticate(user=self.admin)
        # 1. Overdue (untouched past due)
        Payment.objects.create(
            deal=self.deal_installment,
            amount=Decimal("1000000.00"),
            amount_paid=Decimal("0.00"),
            due_date=timezone.localdate() - datetime.timedelta(days=5),
            payment_status=PaymentStatus.PENDING,
        )
        # 2. Partial Overdue (partially paid past due)
        Payment.objects.create(
            deal=self.deal_installment,
            amount=Decimal("1000000.00"),
            amount_paid=Decimal("400000.00"),
            due_date=timezone.localdate() - datetime.timedelta(days=5),
            payment_status=PaymentStatus.PARTIAL,
        )
        # 3. Upcoming Pending
        Payment.objects.create(
            deal=self.deal_installment,
            amount=Decimal("1000000.00"),
            amount_paid=Decimal("0.00"),
            due_date=timezone.localdate() + datetime.timedelta(days=20),
            payment_status=PaymentStatus.PENDING,
        )

        # Filter by overdue=true -> returns both overdue and partial_overdue (count = 2)
        resp_overdue = self.client.get("/api/v1/payments/?overdue=true")
        self.assertEqual(resp_overdue.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_overdue.data["count"], 2)

        # Filter by effective_status=partial_overdue -> returns 1
        resp_partial_overdue = self.client.get("/api/v1/payments/?effective_status=partial_overdue")
        self.assertEqual(resp_partial_overdue.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_partial_overdue.data["count"], 1)

        # Filter by effective_status=overdue -> returns 1
        resp_exact_overdue = self.client.get("/api/v1/payments/?effective_status=overdue")
        self.assertEqual(resp_exact_overdue.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_exact_overdue.data["count"], 1)

        # Confirm pagination metadata
        self.assertIn("count", resp_overdue.data)
        self.assertIn("total_pages", resp_overdue.data)
        self.assertIn("current_page", resp_overdue.data)
        self.assertIn("page_size", resp_overdue.data)
        self.assertIn("results", resp_overdue.data)
