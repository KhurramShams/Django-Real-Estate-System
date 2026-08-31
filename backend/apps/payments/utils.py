import datetime
from decimal import Decimal
from typing import List
from apps.deals.models import Deal, InstallmentFrequency
from apps.payments.models import Payment, PaymentStatus, PaymentMethod


def add_months(sourcedate: datetime.date, months: int) -> datetime.date:
    """
    Safely adds a number of months to a date, clamping days to the end of the month
    (e.g., Jan 31 + 1 month = Feb 28/29).
    """
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1

    days_in_month = [
        31,
        29 if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0) else 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ]
    day = min(sourcedate.day, days_in_month[month - 1])
    return datetime.date(year, month, day)


def generate_deal_installment_plan(deal: Deal) -> List[Payment]:
    """
    Generates a full schedule of Payment records for an installment deal:
    - Splits (agreed_price - booking_amount) evenly across number_of_installments.
    - The final installment absorbs any rounding cents to ensure exact sum matching.
    - Computes calendar-spaced due dates according to installment_frequency.
    """
    net_amount = deal.agreed_price - (deal.booking_amount or Decimal("0.00"))
    num_installments = deal.number_of_installments
    freq = deal.installment_frequency

    month_steps = {
        InstallmentFrequency.MONTHLY: 1,
        InstallmentFrequency.QUARTERLY: 3,
        InstallmentFrequency.BI_ANNUALLY: 6,
        InstallmentFrequency.ANNUALLY: 12,
    }
    step = month_steps.get(freq, 1)

    base_amount = round(net_amount / num_installments, 2)
    final_amount = net_amount - (base_amount * (num_installments - 1))

    start_date = deal.deal_date or datetime.date.today()

    payments_to_create = []
    for i in range(1, num_installments + 1):
        inst_amount = final_amount if i == num_installments else base_amount
        inst_due_date = add_months(start_date, i * step)

        payment = Payment(
            deal=deal,
            amount=inst_amount,
            amount_paid=Decimal("0.00"),
            due_date=inst_due_date,
            payment_status=PaymentStatus.PENDING,
            installment_number=i,
            total_installments=num_installments,
            notes=f"Auto-generated installment #{i} of {num_installments} ({deal.get_installment_frequency_display()})",
        )
        payments_to_create.append(payment)

    created_payments = Payment.objects.bulk_create(payments_to_create)
    return created_payments
