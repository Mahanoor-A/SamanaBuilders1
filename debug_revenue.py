import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'samana_erp.settings')
django.setup()

from payments.models import Payment
from bookings.models import Booking

print("=== PAYMENTS (verified) ===")
verified = Payment.objects.filter(status='verified')
for p in verified:
    print(f"ID: {p.id}, Amount: {p.amount}, Type: {p.payment_type}, Status: {p.status}")
print(f"\nTotal Verified Payments: {sum(p.amount for p in verified)}")

print("\n=== BOOKINGS (advance_paid) ===")
bookings = Booking.objects.all()
for b in bookings:
    print(f"ID: {b.id}, Advance Paid: {b.advance_paid}")
print(f"\nTotal Advance Paid: {sum(b.advance_paid for b in bookings)}")

print("\n=== CALCULATION ===")
verified_total = sum(p.amount for p in verified)
advance_recorded = sum(p.amount for p in verified if p.payment_type == 'advance')
advance_total = sum(b.advance_paid for b in bookings)
unreported = advance_total - advance_recorded

print(f"Verified Total: {verified_total}")
print(f"Advance Recorded: {advance_recorded}")
print(f"Advance Total: {advance_total}")
print(f"Unreported Advance: {unreported}")
print(f"Expected Revenue: {verified_total + unreported}")

print("\n=== BOOKING DETAILS ===")
for b in bookings:
    print(f"Booking {b.id}: Total Amount: {b.total_amount}, Advance Paid: {b.advance_paid}")
