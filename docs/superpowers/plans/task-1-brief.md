# Task 1: Fix Dashboard Revenue Calculation

## Context
The dashboard revenue calculation currently double-counts payments by combining verified payments with "unreported advance" logic. This task fixes it to use a simple SUM of verified payments.

## Files to Modify
- `core/views.py:78-170` (dashboard_view revenue section)

## What to Do
Replace the revenue calculation in `dashboard_view` function. The current code (lines 78-170) has complex logic that calculates `unreported_advance` by comparing `booking.advance_paid` with verified payments. This needs to be replaced with a simple `SUM(verified payments)`.

## Exact Changes Required

### In `core/views.py`, replace lines 78-170 with:

```python
def dashboard_view(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)
    
    verified_payments_qs = Payment.objects.filter(status='verified')
    
    # Revenue = simple sum of all verified payments
    total_revenue = verified_payments_qs.aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue
    monthly_revenue = verified_payments_qs.filter(
        payment_date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue trend (last 12 months)
    twelve_months_ago = today - timedelta(days=365)
    
    payment_monthly = (
        verified_payments_qs.filter(payment_date__gte=twelve_months_ago)
        .annotate(month=TruncMonth('payment_date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )
    
    monthly_revenue_data = [
        {'label': entry['month'].strftime('%b %Y'), 'amount': float(entry['total'])}
        for entry in payment_monthly
    ]
    
    max_amount = max([item['amount'] for item in monthly_revenue_data]) if monthly_revenue_data else 1
    for item in monthly_revenue_data:
        item['pct'] = round((item['amount'] / max_amount) * 100, 1)
```

### Keep everything after line 170 unchanged (booking stats, payment stats, charts, context dict, etc.)

## Verification
After making changes, run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

## Commit
```bash
git add core/views.py
git commit -m "fix: simplify dashboard revenue to SUM of verified payments"
```
