# Properties Module: Stat Cards + Project Status Dropdown

Date: 2026-08-03
Status: Approved

## Goal

1. Make the Properties ERP page's top stat cards (Projects, Total Plots, Available Plots) show correct, filter-consistent counts. Currently Available Plots always renders 0 (`available_plots_count` is never passed by the view).
2. Replace the boolean `Project.is_active` checkbox with a 5-value status dropdown (Coming Soon, Booking Open, Under Construction, Completed, Inactive).

Scope: Django ERP only (templates + backend). React frontend is out of scope per user decision.

## Decision

- Default/new project status: **Booking Open** (`booking_open`).
- Existing projects: `is_active=True → booking_open`, `is_active=False → inactive` (data migration).
- React frontend untouched.

## Changes

### 1. Stat cards (`core/views.py`, `templates/properties.html`)

- `properties_view` also filters the `projects` queryset by `project_filter` so the Projects table and card agree with the plot filter.
- Compute and pass `available_plots_count` = count of `status='available'` within the filtered `plots` queryset.
- Cards display filtered counts: Projects, Total Plots, Available Plots.

### 2. Project status field

- `Project` model: replace `is_active` (BooleanField, default True) with `status` (CharField with choices `coming_soon`, `booking_open`, `under_construction`, `completed`, `inactive`; default `booking_open`).
- Migration `0002`:
  - Add `status` field (default `booking_open`).
  - Data migration mapping `is_active=True → booking_open`, `False → inactive`.
  - Remove `is_active`.
- `ProjectForm` (`properties/forms.py`): replace `is_active` checkbox with `status` Select. New field order: `name, description, location, total_plots, status`.
- `PlotForm` project queryset: `Project.objects.filter(is_active=True)` → `exclude(status='inactive')`.
- `templates/properties.html` project badge: color-coded by status via a small template mapping:
  - coming_soon → `badge-info`, booking_open → `badge-success`, under_construction → `badge-warning`, completed → `badge-secondary`, inactive → `badge-danger`. Label via `get_status_display`.
- Dashboard (`core/views.py`): `Project.objects.filter(is_active=True).count()` → `exclude(status='inactive').count()`.
- `core/views.py` (projects list used by corporate/other view at ~line 866): `filter(is_active=True)` → `exclude(status='inactive')`.
- `properties/admin.py`: ProjectAdmin list_display/list_filter `is_active` → `status`.
- `properties/serializers.py`: ProjectSerializer `is_active` → `status` + `status_display`.
- `properties/api_views.py`: ProjectViewSet `is_active` query filter → `status` query filter.
- `properties/tests.py` and `core/tests.py`: update form data / assertions to `status`.
- `properties/management/commands/seed_data.py`: seed `status` instead of `is_active` for projects.

### 3. Badge color mapping (template)

Project status → badge class:
| status | badge |
|---|---|
| coming_soon | badge-info |
| booking_open | badge-success |
| under_construction | badge-warning |
| completed | badge-secondary |
| inactive | badge-danger |

## Verification

- `manage.py check`, migrations applied, `properties` + `core` tests pass.
- Browser: Properties page stat cards show correct counts (including Available), project badge shows status label/color, Add/Edit Project form shows status dropdown.
