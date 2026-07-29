# Task 2: Booking Payment-Summary Endpoint — Report

## Files Changed
- `bookings/api_views.py`
  - Added imports: `from django.db.models import Sum`, `from payments.models import Payment`
  - Added `payment_summary` action method to `BookingViewSet` (after `confirm` action)

## Commands Run and Output
```
> python manage.py check
System check identified no issues (0 silenced).
```

## Git Commit Hash
`031b7999b0d3d054c1079052413fca84952d25bd`
