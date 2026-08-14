# Task 4 Report: Project-wise Revenue and Top Defaulters

## Status: Complete

## What was done
Added two new data sections to `dashboard_view` in `core/views.py`:

1. **Project-wise revenue** — Aggregates verified payments by project name, producing `project_revenue_data` with project name, revenue, and payment count.

2. **Top defaulters** — Queries overdue installments, groups by customer, and produces `top_defaulters_data` (top 10 by overdue amount) with customer name, ID, overdue count, and overdue amount.

Both were added after the `collection_trend` section and included in the template context.

## Commits
- `feat: add project-wise revenue and top defaulters to dashboard`

## Test
- `manage.py check` passed with 0 issues.

## Concerns
- None. Follows existing patterns (uses `verified_payments_qs`, `Installment` model, `select_related` for efficiency).
