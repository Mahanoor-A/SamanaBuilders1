# Task 5: Add New Stats Cards to Dashboard Template

## Context
Replace the existing 4-card Stats Row 2 with 6 financial overview stat cards.

## Files to Modify
- `templates/dashboard.html`

## What to Do
Find the existing Stats Row 2 section (the `{% if can_view_payments %}` block with 4 stat cards showing Total Revenue, Monthly Revenue, Pending Payments, Overdue Installments) and replace it with 6 stat cards.

## Exact Changes Required

### Find this section in dashboard.html (around line 68-95):
```html
        <!-- Stats Row 2 -->
        {% if can_view_payments %}
        <div class="stats-grid">
            <div class="stat-card animate-fade-up stagger-5">
                ...4 cards...
            </div>
        </div>
        {% endif %}
```

### Replace with:
```html
        <!-- Stats Row 2 - Financial Overview -->
        {% if can_view_payments %}
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="stat-card animate-fade-up stagger-5">
                <div class="stat-icon green">💰</div>
                <div class="stat-value" style="font-size:22px; font-weight:700;">Rs. <span data-target="{{ total_revenue|default:0|floatformat:0 }}">{{ total_revenue|default:0|floatformat:0 }}</span></div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card animate-fade-up stagger-6">
                <div class="stat-icon blue">📈</div>
                <div class="stat-value" style="font-size:22px; font-weight:700;">Rs. <span data-target="{{ monthly_revenue|default:0|floatformat:0 }}">{{ monthly_revenue|default:0|floatformat:0 }}</span></div>
                <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card animate-fade-up stagger-7">
                <div class="stat-icon amber">⏳</div>
                <div class="stat-value" data-target="{{ pending_payments|default:0 }}">{{ pending_payments|default:0 }}</div>
                <div class="stat-label">Pending Payments</div>
            </div>
            <div class="stat-card animate-fade-up stagger-8">
                <div class="stat-icon red">⚠️</div>
                <div class="stat-value" data-target="{{ overdue_installments|default:0 }}">{{ overdue_installments|default:0 }}</div>
                <div class="stat-label">Overdue Installments</div>
            </div>
            <div class="stat-card animate-fade-up stagger-9">
                <div class="stat-icon teal">📊</div>
                <div class="stat-value" data-target="{{ collection_rate|default:0 }}">{{ collection_rate|default:0 }}%</div>
                <div class="stat-label">Collection Rate</div>
            </div>
            <div class="stat-card animate-fade-up stagger-10">
                <div class="stat-icon violet">📋</div>
                <div class="stat-value" data-target="{{ active_bookings|default:0 }}">{{ active_bookings|default:0 }}</div>
                <div class="stat-label">Active Bookings</div>
            </div>
        </div>
        {% endif %}
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add templates/dashboard.html
git commit -m "feat: add 6 financial overview stat cards to dashboard"
```
