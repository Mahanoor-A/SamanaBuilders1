# Task 2: Add Revenue by Payment Type Chart Data

## Context
After fixing the revenue calculation, we need to add a breakdown of revenue by payment type (down_payment, installment, full_payment, etc.) for a doughnut chart on the dashboard.

## Files to Modify
- `core/views.py` (dashboard_view function)

## What to Do
Add payment type breakdown data to dashboard_view, after the monthly_revenue_data section.

## Exact Changes Required

### In `core/views.py`, after the `monthly_revenue_data` section (after `item['pct'] = round(...)` line), add:

```python
    # Revenue by payment type
    type_data = (
        verified_payments_qs.values('payment_type')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    type_labels = dict(Payment.PAYMENT_TYPE_CHOICES)
    payment_type_data = [
        {'type': type_labels.get(t['payment_type'], t['payment_type']), 'total': float(t['total'])}
        for t in type_data
    ]
```

### In the `context` dictionary, add:
```python
        'payment_type_data': payment_type_data,
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

## Commit
```bash
git add core/views.py
git commit -m "feat: add revenue by payment type breakdown to dashboard"
```
