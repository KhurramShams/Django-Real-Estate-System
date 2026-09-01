import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole
from apps.properties.models import Property, PropertyType, ListingType, PropertyStatus
from apps.clients.models import Client, ClientType, ClientSource
from apps.deals.models import Deal, DealType, DealStatus, CommissionStatus, InstallmentFrequency
from apps.payments.models import Payment, PaymentMethod, PaymentStatus

User = get_user_model()

def seed_all():
    print("=== SEEDING COMPREHENSIVE PRODUCTION DEMO DATA TO AIVEN POSTGRESQL ===")

    # 1. Users
    users_data = [
        {
            "email": "admin.paytest@luxuryrealty.com",
            "password": "AdminPass2026!",
            "first_name": "Admin",
            "last_name": "Boss",
            "role": UserRole.ADMIN,
            "is_staff": True,
            "is_superuser": True,
        },
        {
            "email": "agent.pay.a@luxuryrealty.com",
            "password": "AgentPass2026!",
            "first_name": "Agent",
            "last_name": "Alpha",
            "role": UserRole.AGENT,
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "email": "agent.beta@luxuryrealty.com",
            "password": "AgentPass2026!",
            "first_name": "Agent",
            "last_name": "Beta",
            "role": UserRole.AGENT,
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "email": "accountant.paytest@luxuryrealty.com",
            "password": "AccountantPass2026!",
            "first_name": "Accountant",
            "last_name": "Pro",
            "role": UserRole.ACCOUNTANT,
            "is_staff": False,
            "is_superuser": False,
        },
        {
            "email": "staff.test@luxuryrealty.com",
            "password": "StaffPass2026!",
            "first_name": "Staff",
            "last_name": "Member",
            "role": UserRole.STAFF,
            "is_staff": False,
            "is_superuser": False,
        },
    ]

    users = {}
    for u in users_data:
        user, _ = User.objects.get_or_create(
            email=u["email"],
            defaults={
                "first_name": u["first_name"],
                "last_name": u["last_name"],
                "role": u["role"],
                "is_staff": u["is_staff"],
                "is_superuser": u["is_superuser"],
            },
        )
        user.set_password(u["password"])
        user.role = u["role"]
        user.is_staff = u["is_staff"]
        user.is_superuser = u["is_superuser"]
        user.save()
        users[u["email"]] = user
        print(f" [User] {u['email']} ({u['role']})")

    admin = users["admin.paytest@luxuryrealty.com"]
    agent_a = users["agent.pay.a@luxuryrealty.com"]
    agent_b = users["agent.beta@luxuryrealty.com"]

    # 2. Properties
    properties_data = [
        {
            "title": "Modern Luxury Villa in F-6 Sector",
            "description": "Executive 1 Kanal designer villa with private swimming pool, smart automation, solar backup, and imported Italian marble finishes.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("95000000.00"),
            "size": Decimal("1.00"),
            "size_unit": "kanal",
            "city": "Islamabad",
            "locality": "Sector F-6/2",
            "address": "Street 14, Sector F-6/2, Islamabad",
        },
        {
            "title": "Penthouse Apartment in Centaurus Residencies",
            "description": "3-bedroom luxury penthouse overlooking Margalla Hills with private elevator and concierge access.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.RENT,
            "status": PropertyStatus.UNDER_NEGOTIATION,
            "price": Decimal("450000.00"),
            "size": Decimal("3200.00"),
            "size_unit": "sq_ft",
            "city": "Islamabad",
            "locality": "Blue Area",
            "address": "Centaurus Residencies, Jinnah Ave, Blue Area, Islamabad",
        },
        {
            "title": "Commercial Plaza in DHA Phase 2",
            "description": "Multi-storey commercial building suited for corporate headquarters or bank branch with direct expressway frontage.",
            "property_type": PropertyType.COMMERCIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.SOLD,
            "price": Decimal("180000000.00"),
            "size": Decimal("2.00"),
            "size_unit": "kanal",
            "city": "Islamabad",
            "locality": "DHA Phase 2",
            "address": "Main Boulevard, DHA Phase 2, Islamabad",
        },
        {
            "title": "Executive Farmhouse 4 Kanal in Gulberg Greens",
            "description": "Scenic luxury farmhouse estate featuring lush landscaped gardens, guest annex, and solar generation system.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("145000000.00"),
            "size": Decimal("4.00"),
            "size_unit": "kanal",
            "city": "Islamabad",
            "locality": "Gulberg Greens",
            "address": "Executive Block, Gulberg Greens, Islamabad",
        },
        {
            "title": "Bahria Town Phase 7 Luxury 2-Bed Apartment",
            "description": "Brand new high-floor apartment overlooking the river with dedicated underground parking and fitness club.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("18500000.00"),
            "size": Decimal("1450.00"),
            "size_unit": "sq_ft",
            "city": "Rawalpindi",
            "locality": "Bahria Town Phase 7",
            "address": "River View Heights, Phase 7, Bahria Town",
        },
        {
            "title": "Corporate Office Floor in Blue Area",
            "description": "Fully fitted executive office floor with glass partitions, conference room, and high-speed fiber backbone.",
            "property_type": PropertyType.COMMERCIAL,
            "listing_type": ListingType.RENT,
            "status": PropertyStatus.RENTED,
            "price": Decimal("1200000.00"),
            "size": Decimal("5000.00"),
            "size_unit": "sq_ft",
            "city": "Islamabad",
            "locality": "Blue Area",
            "address": "Saudi Pak Tower, Blue Area, Islamabad",
        },
        {
            "title": "1 Kanal Corner Plot in DHA Phase 5 Lahore",
            "description": "Prime residential corner plot facing 100ft wide boulevard, park facing, ready for immediate house construction.",
            "property_type": PropertyType.PLOT,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("52000000.00"),
            "size": Decimal("1.00"),
            "size_unit": "kanal",
            "city": "Lahore",
            "locality": "DHA Phase 5",
            "address": "Sector C, DHA Phase 5, Lahore",
        },
        {
            "title": "Sea-View 3-Bed Apartment in Clifton Block 4",
            "description": "Renovated beachfront residence with panoramic Arabian Sea views and 24/7 security surveillance.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.UNDER_NEGOTIATION,
            "price": Decimal("38000000.00"),
            "size": Decimal("2400.00"),
            "size_unit": "sq_ft",
            "city": "Karachi",
            "locality": "Clifton Block 4",
            "address": "Ocean Towers Residences, Clifton, Karachi",
        },
        {
            "title": "Brand New 10 Marla Designer House in E-11",
            "description": "Contemporary architecture, 5 master bedrooms, rooftop terrace, and servant quarters.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("48000000.00"),
            "size": Decimal("10.00"),
            "size_unit": "marla",
            "city": "Islamabad",
            "locality": "Sector E-11/3",
            "address": "Street 22, Sector E-11/3, Islamabad",
        },
        {
            "title": "G-13 Semi-Furnished 10 Marla House",
            "description": "Well-maintained double storey house close to Metro Bus Station and commercial market.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.SOLD,
            "price": Decimal("34000000.00"),
            "size": Decimal("10.00"),
            "size_unit": "marla",
            "city": "Islamabad",
            "locality": "Sector G-13/2",
            "address": "Street 8, Sector G-13/2, Islamabad",
        },
        {
            "title": "Modern Bungalow in DHA Phase 6 Lahore",
            "description": "Luxury 1 Kanal Spanish architecture bungalow with swimming pool, basement home cinema, and landscaped lawn.",
            "property_type": PropertyType.RESIDENTIAL,
            "listing_type": ListingType.SALE,
            "status": PropertyStatus.AVAILABLE,
            "price": Decimal("89000000.00"),
            "size": Decimal("1.00"),
            "size_unit": "kanal",
            "city": "Lahore",
            "locality": "DHA Phase 6",
            "address": "Main Boulevard, DHA Phase 6, Lahore",
        },
        {
            "title": "Industrial Warehouse in I-9 Industrial Area",
            "description": "2 Kanal covered industrial storage hall with 3-phase industrial electricity and heavy vehicle access.",
            "property_type": PropertyType.INDUSTRIAL,
            "listing_type": ListingType.RENT,
            "status": PropertyStatus.OFF_MARKET,
            "price": Decimal("650000.00"),
            "size": Decimal("2.00"),
            "size_unit": "kanal",
            "city": "Islamabad",
            "locality": "Sector I-9",
            "address": "Industrial Zone, Sector I-9, Islamabad",
        },
    ]

    properties = {}
    for p in properties_data:
        prop, _ = Property.objects.get_or_create(
            title=p["title"],
            defaults=p,
        )
        # Update fields if existed
        for k, v in p.items():
            setattr(prop, k, v)
        prop.save()
        properties[p["title"]] = prop
        print(f" [Property] {p['title']} ({p['status'].upper()})")

    # 3. Clients
    clients_data = [
        {
            "full_name": "Babar Azam",
            "phone_number": "+92-300-1234567",
            "email": "babar@example.com",
            "cnic": "42101-1234567-1",
            "client_type": ClientType.BUYER,
            "source": ClientSource.REFERRAL,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("80000000.00"),
            "budget_max": Decimal("120000000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": agent_a,
            "notes": "Looking for ready-to-move designer villa in Sector F-6 or F-7.",
        },
        {
            "full_name": "Shahid Khan Afridi",
            "phone_number": "+92-321-9876543",
            "email": "afridi@boomrealty.com",
            "cnic": "42201-9876543-3",
            "client_type": ClientType.BUYER,
            "source": ClientSource.PORTAL_ZAMEEN,
            "preferred_property_type": PropertyType.COMMERCIAL,
            "budget_min": Decimal("150000000.00"),
            "budget_max": Decimal("200000000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": admin,
            "notes": "Commercial investor interested in plazas with high rental yields.",
        },
        {
            "full_name": "Fatima Zahra",
            "phone_number": "+92-333-5544332",
            "email": "fatima.zahra@corporatemail.com",
            "cnic": "61101-5544332-6",
            "client_type": ClientType.BUYER,
            "source": ClientSource.WALK_IN,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("15000000.00"),
            "budget_max": Decimal("25000000.00"),
            "preferred_city": "Rawalpindi",
            "assigned_agent": agent_b,
            "notes": "Looking for 2-3 bed luxury apartment in Bahria Town.",
        },
        {
            "full_name": "Malik Riaz Hussain",
            "phone_number": "+92-300-8889900",
            "email": "malik.riaz@estateinvest.pk",
            "cnic": "37405-8889900-1",
            "client_type": ClientType.BUYER,
            "source": ClientSource.DIRECT_CALL,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("100000000.00"),
            "budget_max": Decimal("250000000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": admin,
            "notes": "Interested in large acreage farmhouses and commercial plots.",
        },
        {
            "full_name": "Zainab Tariq",
            "phone_number": "+92-345-1122334",
            "email": "zainab.tariq@multinational.org",
            "client_type": ClientType.TENANT,
            "source": ClientSource.PORTAL_ZAMEEN,
            "preferred_property_type": PropertyType.COMMERCIAL,
            "budget_min": Decimal("800000.00"),
            "budget_max": Decimal("1500000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": agent_a,
            "notes": "Regional director seeking corporate office space in Blue Area.",
        },
        {
            "full_name": "Hamza Ali Abbasi",
            "phone_number": "+92-312-7788990",
            "email": "hamza.abbasi@mediahouse.pk",
            "cnic": "42301-7788990-5",
            "client_type": ClientType.BUYER,
            "source": ClientSource.SOCIAL_MEDIA,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("35000000.00"),
            "budget_max": Decimal("50000000.00"),
            "preferred_city": "Karachi",
            "assigned_agent": agent_b,
            "notes": "Seeking sea-facing luxury apartment in Clifton or DHA Karachi.",
        },
        {
            "full_name": "Ayesha Siddiqui",
            "phone_number": "+92-320-4455667",
            "email": "ayesha.s@creativeconsult.com",
            "client_type": ClientType.SELLER,
            "source": ClientSource.REFERRAL,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("40000000.00"),
            "budget_max": Decimal("55000000.00"),
            "preferred_city": "Islamabad",
            "assigned_agent": agent_a,
            "notes": "Owner listing newly constructed house in E-11.",
        },
        {
            "full_name": "Usman Tariq",
            "phone_number": "+92-302-9988776",
            "email": "usman.tariq@lahoretrade.com",
            "cnic": "35202-9988776-9",
            "client_type": ClientType.BUYER,
            "source": ClientSource.PORTAL_ZAMEEN,
            "preferred_property_type": PropertyType.RESIDENTIAL,
            "budget_min": Decimal("80000000.00"),
            "budget_max": Decimal("100000000.00"),
            "preferred_city": "Lahore",
            "assigned_agent": admin,
            "notes": "Looking for ready bungalow in DHA Phase 6 Lahore.",
        },
    ]

    clients = {}
    for c in clients_data:
        client, _ = Client.objects.get_or_create(
            full_name=c["full_name"],
            defaults=c,
        )
        for k, v in c.items():
            setattr(client, k, v)
        client.save()
        clients[c["full_name"]] = client
        print(f" [Client] {c['full_name']} ({c['client_type'].upper()})")

    # 4. Deals
    today = date.today()
    deals_data = [
        {
            "property": properties["Commercial Plaza in DHA Phase 2"],
            "client": clients["Shahid Khan Afridi"],
            "agent": admin,
            "deal_type": DealType.SALE,
            "deal_status": DealStatus.COMPLETED,
            "agreed_price": Decimal("180000000.00"),
            "booking_amount": Decimal("20000000.00"),
            "commission_percentage": Decimal("1.00"),
            "commission_amount": Decimal("1800000.00"),
            "commission_status": CommissionStatus.PAID,
            "is_installment": False,
            "deal_date": today - timedelta(days=12),
            "notes": "Completed commercial acquisition, full payment settled.",
        },
        {
            "property": properties["Modern Luxury Villa in F-6 Sector"],
            "client": clients["Babar Azam"],
            "agent": agent_a,
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
            "deal_date": today - timedelta(days=20),
            "notes": "Installment plan active with 4 quarterly milestones.",
        },
        {
            "property": properties["Executive Farmhouse 4 Kanal in Gulberg Greens"],
            "client": clients["Malik Riaz Hussain"],
            "agent": admin,
            "deal_type": DealType.SALE,
            "deal_status": DealStatus.BOOKED,
            "agreed_price": Decimal("140000000.00"),
            "booking_amount": Decimal("15000000.00"),
            "commission_percentage": Decimal("1.50"),
            "commission_amount": Decimal("2100000.00"),
            "commission_status": CommissionStatus.PENDING,
            "is_installment": True,
            "number_of_installments": 6,
            "installment_frequency": InstallmentFrequency.MONTHLY,
            "deal_date": today - timedelta(days=5),
            "notes": "Token deposit verified, structuring installment ledger.",
        },
        {
            "property": properties["Penthouse Apartment in Centaurus Residencies"],
            "client": clients["Fatima Zahra"],
            "agent": agent_a,
            "deal_type": DealType.RENT,
            "deal_status": DealStatus.NEGOTIATION,
            "agreed_price": Decimal("450000.00"),
            "booking_amount": Decimal("100000.00"),
            "commission_percentage": Decimal("10.00"),
            "commission_amount": Decimal("45000.00"),
            "commission_status": CommissionStatus.PENDING,
            "is_installment": False,
            "deal_date": today - timedelta(days=2),
            "notes": "Lease agreement under legal review.",
        },
        {
            "property": properties["Sea-View 3-Bed Apartment in Clifton Block 4"],
            "client": clients["Hamza Ali Abbasi"],
            "agent": agent_b,
            "deal_type": DealType.SALE,
            "deal_status": DealStatus.NEGOTIATION,
            "agreed_price": Decimal("38000000.00"),
            "booking_amount": Decimal("2000000.00"),
            "commission_percentage": Decimal("1.50"),
            "commission_amount": Decimal("570000.00"),
            "commission_status": CommissionStatus.PENDING,
            "is_installment": False,
            "deal_date": today - timedelta(days=3),
            "notes": "Price negotiation in final stage.",
        },
        {
            "property": properties["G-13 Semi-Furnished 10 Marla House"],
            "client": clients["Usman Tariq"],
            "agent": admin,
            "deal_type": DealType.SALE,
            "deal_status": DealStatus.COMPLETED,
            "agreed_price": Decimal("34000000.00"),
            "booking_amount": Decimal("5000000.00"),
            "commission_percentage": Decimal("1.50"),
            "commission_amount": Decimal("510000.00"),
            "commission_status": CommissionStatus.PAID,
            "is_installment": False,
            "deal_date": today - timedelta(days=8),
            "notes": "Deal completed and ownership transferred.",
        },
    ]

    deals = []
    for d in deals_data:
        deal, _ = Deal.objects.get_or_create(
            property=d["property"],
            client=d["client"],
            defaults=d,
        )
        for k, v in d.items():
            setattr(deal, k, v)
        deal.save()
        deals.append(deal)
        print(f" [Deal] {d['property'].title} -> {d['client'].full_name} ({d['deal_status'].upper()})")

    # 5. Payments for active Villa deal (d[1])
    villa_deal = deals[1]
    net_amt = Decimal("20000000.00")

    # Installment 1: Paid on time
    Payment.objects.get_or_create(
        deal=villa_deal,
        installment_number=1,
        defaults={
            "amount": net_amt,
            "amount_paid": net_amt,
            "due_date": today - timedelta(days=60),
            "paid_date": today - timedelta(days=58),
            "payment_status": PaymentStatus.PAID,
            "payment_method": PaymentMethod.BANK_TRANSFER,
            "transaction_reference": "HBL-FT-998811",
        }
    )

    # Installment 2: Partial Overdue (paid 50 Lakh, 1.5 Cr overdue)
    Payment.objects.get_or_create(
        deal=villa_deal,
        installment_number=2,
        defaults={
            "amount": net_amt,
            "amount_paid": Decimal("5000000.00"),
            "due_date": today - timedelta(days=10),
            "paid_date": today - timedelta(days=15),
            "payment_status": PaymentStatus.PARTIAL,
            "payment_method": PaymentMethod.CHEQUE,
            "transaction_reference": "CHQ-MEEZAN-5544",
        }
    )

    # Installment 3: Upcoming Pending Milestone
    Payment.objects.get_or_create(
        deal=villa_deal,
        installment_number=3,
        defaults={
            "amount": net_amt,
            "amount_paid": Decimal("0.00"),
            "due_date": today + timedelta(days=30),
            "payment_status": PaymentStatus.PENDING,
            "payment_method": PaymentMethod.BANK_TRANSFER,
        }
    )

    # Installment 4: Future Final Milestone
    Payment.objects.get_or_create(
        deal=villa_deal,
        installment_number=4,
        defaults={
            "amount": net_amt,
            "amount_paid": Decimal("0.00"),
            "due_date": today + timedelta(days=120),
            "payment_status": PaymentStatus.PENDING,
            "payment_method": PaymentMethod.BANK_TRANSFER,
        }
    )

    # Payments for Farmhouse deal (deals[2])
    farmhouse_deal = deals[2]
    fh_amt = Decimal("20833333.33")
    Payment.objects.get_or_create(
        deal=farmhouse_deal,
        installment_number=1,
        defaults={
            "amount": fh_amt,
            "amount_paid": Decimal("0.00"),
            "due_date": today - timedelta(days=3),  # Full Overdue
            "payment_status": PaymentStatus.PENDING,
            "payment_method": PaymentMethod.BANK_TRANSFER,
        }
    )

    Payment.objects.get_or_create(
        deal=farmhouse_deal,
        installment_number=2,
        defaults={
            "amount": fh_amt,
            "amount_paid": Decimal("0.00"),
            "due_date": today + timedelta(days=27),
            "payment_status": PaymentStatus.PENDING,
            "payment_method": PaymentMethod.BANK_TRANSFER,
        }
    )

    print("\n=== COMPREHENSIVE DATA SEEDED SUCCESSFULLY TO AIVEN POSTGRESQL ===")
    print(f"Total Users:      {User.objects.count()}")
    print(f"Total Properties: {Property.objects.count()}")
    print(f"Total Clients:    {Client.objects.count()}")
    print(f"Total Deals:      {Deal.objects.count()}")
    print(f"Total Payments:   {Payment.objects.count()}")

if __name__ == "__main__":
    seed_all()
