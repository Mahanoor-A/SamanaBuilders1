# Task 7: Add Project-wise Revenue and Top Defaulters Tables

## Context
Add two new table sections to the dashboard: Project-wise Revenue and Top Defaulters.

## Files to Modify
- `templates/dashboard.html`

## What to Do
Add project-wise revenue table and top defaulters table BEFORE the "Recent Bookings" section.

## Exact Changes Required

### Find the "Recent Bookings" section (look for `<!-- Recent Bookings -->`) and ADD this BEFORE it:

```html
        <!-- Project-wise Revenue & Top Defaulters -->
        <div class="charts-grid-2col">
            {% if can_view_payments and project_revenue_data %}
            <div class="card animate-fade-up stagger-6">
                <div class="card-header">
                    <h3>🏗️ Project-wise Revenue</h3>
                </div>
                <div class="table-container">
                    <table class="sortable">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Revenue (Rs.)</th>
                                <th>Payments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for p in project_revenue_data %}
                            <tr>
                                <td><strong>{{ p.project }}</strong></td>
                                <td style="font-weight:600;">Rs. {{ p.revenue|floatformat:0 }}</td>
                                <td>{{ p.count }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
            {% endif %}

            {% if can_view_payments and top_defaulters_data %}
            <div class="card animate-fade-up stagger-7">
                <div class="card-header">
                    <h3>⚠️ Top Defaulters</h3>
                </div>
                <div class="table-container">
                    <table class="sortable">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Overdue</th>
                                <th>Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for d in top_defaulters_data %}
                            <tr>
                                <td>
                                    <strong>{{ d.name }}</strong>
                                    <br><span style="font-size:12px; color:var(--text-secondary);">{{ d.customer_id }}</span>
                                </td>
                                <td>{{ d.overdue_count }} installments</td>
                                <td style="font-weight:600; color:var(--danger);">Rs. {{ d.overdue_amount|floatformat:0 }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
            {% endif %}
        </div>
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add templates/dashboard.html
git commit -m "feat: add project-wise revenue and top defaulters tables to dashboard"
```
