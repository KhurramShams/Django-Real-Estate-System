import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.properties.models import Property, PropertyType, ListingType, PropertyStatus
from apps.clients.models import Client, ClientType, ClientSource
from apps.deals.models import Deal, DealType, DealStatus, CommissionStatus, InstallmentFrequency
from apps.payments.models import Payment, PaymentMethod, PaymentStatus

User = get_user_model()

def seed_full():
    admin = User.objects.get(email="admin.paytest@luxuryrealty.com")
    agent = User.objects.get(email="agent.pay.a@luxuryrealty.com")

    # 1. Properties
    p1, _ = Property.objects.get_or_create(
        title="Modern Luxury Villa in F-6 Sector",
        defaults={
            "description": "Executive 1 Kanal designer villa with private pool, solar backup, and imported fittings.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("95000000.00"),
            "size": Decimal("1.00"),
            "size_unit": "kanal",
            "city": "Islamabad",
            "locality": "Sector F-6/2",
            "address": "Street 14, Sector F-6/2, Islamabad",
        }
    )

    p2, _ = Property.objects.get_or_create(
        title="Penthouse Apartment in Centaurus",
        defaults={
            "description": "3-bedroom luxury penthouse overlooking Margalla Hills.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.RENT,
            "status": PropertyStatus.UNDER_NEGOTIATION,
            "price": Decimal("450000.00"),
            "size": Decimal("3200.00"),
            "size_unit": "sq_ft",
            "city": "Islamabad",
            "locality": "Blue Area",
            "address": "Centaurus Residencies, Jinnah Ave",
        }
    )

    p3, _ = Property.objects.get_or_create(
        title="Commercial Plaza in DHA Phase 2",
        defaults={
            "description": "Multi-storey commercial building suited for corporate headquarters or bank branch.",
            "property_type": PropertyType.COMMERCIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.SOLD,
            "price": Decimal("180000000.00"),
            "size": Decimal("2.00"),
            "size_unit": "kanal",
            "city": "Islamabad",
            "locality": "DHA Phase 2",
            "address": "Main Boulevard, DHA Phase 2",
        }
    )

    # 2. Clients
    c1, _ = Client.objects.get_or_create(
        full_name="Babar Azam",
        defaults={
            "phone_number": "+92-300-1234567",
            "email": "babar@example.com",
            "cnic": "42101-1234567-1",
            "client_type": ClientType.BUYER,
            "source": ClientSource.REFERRAL,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("80000000.00"),
            "budget_max": Decimal("120000000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": agent,
            "notes": "Looking for immediate possession in Sector F-6 or F-7.",
        }
    )

    c2, _ = Client.objects.get_or_create(
        full_name="Shahid Khan Afridi",
        defaults={
            "phone_number": "+92-321-9876543",
            "email": "afridi@boomrealty.com",
            "client_type": ClientType.BUYER,
            "source": ClientSource.PORTAL_ZAMEEN,
            "preferred_property_type": PropertyType.COMMERCIAL,
            "budget_min": Decimal("150000000.00"),
            "budget_max": Decimal("200000000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": admin,
            "notes": "Investor in high-yield commercial assets.",
        }
    )

    # 3. Deals
    d1, _ = Deal.objects.get_or_create(
        property=p3,
        client=c2,
        defaults={
            "agent": admin,
            "deal_type": DealType.SALE,
            "deal_status": DealStatus.COMPLETED,
            "agreed_price": Decimal("180000000.00"),
            "booking_amount": Decimal("20000000.00"),
            "commission_percentage": Decimal("1.00"),
            "commission_amount": Decimal("1800000.00"),
            "commission_status": CommissionStatus.PAID,
            "is_installment": False,
            "deal_date": date.today(),
            "notes": "Closed transaction, full payment transferred.",
        }
    )

    d2, _ = Deal.objects.get_or_create(
        property=p1,
        client=c1,
        defaults={
            "agent": agent,
            "deal_type": DealType.SALE,
            "deal_status": DealStatus.IN_PROGRESS,
            "agreed_price": Decimal("90000000.00"),
            "booking_amount": Decimal("10000000.00"),
            "commission_percentage": Decimal("1.50"),
            "commission_amount": Decimal("1350000.00"),
            "commission_status": CommissionStatus.PENDING,
            "is_installment": True,
            "number_of_installments": 4,
            "installment_frequency": InstallmentFrequency.QUARTERLY,
            "deal_date": date.today(),
            "notes": "4 equal quarterly installments structured.",
        }
    )

    # 4. Payments
    net_amt = Decimal("20000000.00")
    Payment.objects.get_or_create(
        deal=d2,
        installment_number=1,
        defaults={
            "amount": net_amt,
            "amount_paid": Decimal("20000000.00"),
            "due_date": date.today() - timedelta(days=30),
            "paid_date": date.today() - timedelta(days=28),
            "payment_status": PaymentStatus.PAID,
            "payment_method": PaymentMethod.BANK_TRANSFER,
            "transaction_reference": "HBL-FT-998811",
        }
    )

    Payment.objects.get_or_create(
        deal=d2,
        installment_number=2,
        defaults={
            "amount": net_amt,
            "amount_paid": Decimal("5000000.00"),
            "due_date": date.today() - timedelta(days=5),
            "payment_status": PaymentStatus.PARTIAL,
            "payment_method": PaymentMethod.CHEQUE,
            "transaction_reference": "CHQ-MEEZAN-5544",
        }
    )

    Payment.objects.get_or_create(
        deal=d2,
        installment_number=3,
        defaults={
            "amount": net_amt,
            "amount_paid": Decimal("0.00"),
            "due_date": date.today() + timedelta(days=85),
            "payment_status": PaymentStatus.PENDING,
            "payment_method": PaymentMethod.BANK_TRANSFER,
        }
    )

    print("Full demo dataset seeded to Aiven PostgreSQL successfully!")

if __name__ == "__main__":
    seed_full()
