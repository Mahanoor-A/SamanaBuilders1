# Task 3: Add Collection Rate Trend Data

## Context
Add collection rate trend data (monthly %) for a line chart on the dashboard.

## Files to Modify
- `core/views.py` (dashboard_view function)

## What to Do
Add collection rate trend data to dashboard_view, after the payment_type_data section.

## Exact Changes Required

### In `core/views.py`, after the payment_type_data section, add:

```python
    # Collection rate trend (last 12 months)
    collection_trend = []
    for i in range(11, -1, -1):
        target_date = today - timedelta(days=30 * i)
        m_start = target_date.replace(day=1)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1, day=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1, day=1)
        
        month_total = Installment.objects.filter(
            due_date__gte=m_start, due_date__lt=m_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        month_paid = Installment.objects.filter(
            due_date__gte=m_start, due_date__lt=m_end
        ).aggregate(total=Sum('paid_amount'))['total'] or 0
        
        rate = round((month_paid / month_total) * 100, 1) if month_total > 0 else 0
        if rate > 100:
            rate = 100
        
        collection_trend.append({
            'label': m_start.strftime('%b %Y'),
            'rate': rate
        })
```

### In the `context` dictionary, add:
```python
        'collection_trend': collection_trend,
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add core/views.py
git commit -m "feat: add collection rate trend data for dashboard chart"
```
