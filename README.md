# Samana Builders - Real Estate Management ERP

A comprehensive Real Estate Management ERP + Corporate Website for **Samana Builders & Developers (Pvt.) Ltd.**

## Technology Stack

- **Backend:** Python Django + Django REST Framework
- **Frontend:** Django Templates (Professional Blue Theme) | React.js (planned)
- **Database:** SQLite (dev) | PostgreSQL (production)
- **API:** RESTful API via DRF

## ERP Modules

| Module | Description |
|--------|-------------|
| Customer Management | Auto-generated IDs (CUS-XXXXX), search, booking history |
| Property Inventory | Projects & plots with status tracking (Available/Reserved/Booked/Sold) |
| Booking & Ledger | Full workflow with balance tracking |
| Payment Verification | Pending → Verified/Rejected with audit trail |
| Dashboard | Real-time stats, quick actions, recent activity |
| Audit Logs | Full action history with timestamps and IP tracking |
| Role-Based Access | Super Admin, Admin, Sales, Accounts, Management |

## Features

- Auto-generated IDs for customers, bookings, and payments
- CNIC validation (XXXXX-XXXXXXX-X format)
- Payment workflow with verification/rejection
- Role-based permission decorators
- Full CRUD for all entities
- Search and filter capabilities
- Audit trail logging all user actions
- REST API endpoints at `/api/`

## Quick Start

```bash
# Clone the repository
git clone https://github.com/kali69017/SamanaBuilders.git
cd SamanaBuilders

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## Default Login

- **URL:** http://127.0.0.1:8000/login/
- **Admin:** `admin` / `admin123`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/customers/` | Customer CRUD |
| `/api/projects/` | Project CRUD |
| `/api/plots/` | Plot CRUD |
| `/api/bookings/` | Booking CRUD |
| `/api/payments/` | Payment CRUD |
| `/api/receipts/` | Receipt CRUD |

## Project Structure

```
Samana Builders/
├── samana_erp/          # Django project settings
├── core/                # Dashboard, auth, permissions, audit logs
├── customers/           # Customer management module
├── properties/          # Projects & plots module
├── bookings/            # Bookings & installment plans
├── payments/            # Payments & verification workflow
├── api/                 # REST API URL routing
├── templates/           # HTML templates (Professional Blue theme)
└── themes/              # Theme samples
```

## Testing

```bash
python manage.py test
```

## License

Private - Samana Builders & Developers (Pvt.) Ltd.
