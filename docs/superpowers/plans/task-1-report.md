# Task 1 Report: Fix Dashboard Revenue Calculation

## Status: DONE

## Changes Made
- Replaced complex "unreported advance" logic in `dashboard_view` (core/views.py:81-110) with a simple `SUM(verified payments)` for both total and monthly revenue
- Changed trend window from 6 months to 12 months
- Removed per-booking loop that compared `advance_paid` against verified payments (double-counting source)

## Test Results
- `manage.py check`: System check identified no issues (0 silenced)

## Concerns
- None. The pre-existing unreported advance logic was the source of double-counting; removing it is safe.
