# Task 4: Add Project-wise Revenue and Top Defaulters Data

## Context
Add project-wise revenue breakdown and top defaulters (customers with overdue installments) data for tables on the dashboard.

## Files to Modify
- `core/views.py` (dashboard_view function)

## What to Do
Add project_revenue_data and top_defaulters_data to dashboard_view, after the collection_trend section.

## Exact Changes Required

### In `core/views.py`, after the collection_trend section, add:

```python
    # Project-wise revenue
    project_revenue = (
        verified_payments_qs
        .values('booking__plot__project__name')
        .annotate(revenue=Sum('amount'), count=Count('id'))
        .order_by('-revenue')
    )
    project_revenue_data = [
        {
            'project': p['booking__plot__project__name'] or 'Unknown',
            'revenue': float(p['revenue']),
            'count': p['count']
        }
        for p in project_revenue
    ]
    
    # Top defaulters (customers with overdue installments)
    overdue_installments_qs = Installment.objects.filter(
        status='overdue'
    ).select_related('plan__booking__customer')
    
    defaulter_map = {}
    for inst in overdue_installments_qs:
        customer = inst.plan.booking.customer
        if customer.pk not in defaulter_map:
            defaulter_map[customer.pk] = {
                'name': customer.full_name,
                'customer_id': customer.customer_id,
                'overdue_count': 0,
                'overdue_amount': 0,
            }
        defaulter_map[customer.pk]['overdue_count'] += 1
        defaulter_map[customer.pk]['overdue_amount'] += float(inst.amount + inst.late_fee - inst.paid_amount)
    
    top_defaulters_data = sorted(
        defaulter_map.values(),
        key=lambda x: x['overdue_amount'],
        reverse=True
    )[:10]
```

### In the `context` dictionary, add:
```python
        'project_revenue_data': project_revenue_data,
        'top_defaulters_data': top_defaulters_data,
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add core/views.py
git commit -m "feat: add project-wise revenue and top defaulters to dashboard"
```
