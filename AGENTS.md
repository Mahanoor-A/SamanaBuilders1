# Samana Builders - Real Estate Management ERP

## Project Overview
- Real Estate Management ERP + Corporate Website for Samana Builders & Developers
- Integrated solution: Corporate website + Secure ERP + WhatsApp/email integrations

## Technology Stack
- **Backend**: Python Django + Django REST Framework
- **Frontend**: React.js (to be initialized)
- **Database**: PostgreSQL (psycopg2-binary installed)
- **Messaging**: WhatsApp Business API, Twilio, or WATI
- **Hosting**: Linux VPS

## Architecture
- Django backend serves API via DRF
- React.js frontend consumes API

## ERP Modules (14 total)
1. Customer Management - Auto-generated IDs, search, booking history
2. Property Inventory - Status tracking (Available/Reserved/Booked/Sold/Cancelled)
3. Booking & Customer Ledger - Workflow, linkage, running balance
4. Installment Management - Auto-generation, late fees, tracking
5. Payment Verification - Entry workflow, approval/rejection
6. Receipts & Invoices - Auto-generation, branded PDFs
7. Office Payment Entry - Front-desk screen, instant receipts
8. Financial Reports - Collection, defaulter, revenue reports
9. Audit & Activity Logs - User actions, approval history
10. Notifications - Email, SMS, WhatsApp
11. Role-Based Access - Super Admin, Admin, Sales, Accounts, Management
12. Backup & Recovery - Scheduled backups, restoration
13. Multi-Project - Multiple real estate projects
14. Security - Encryption, 2FA, IP restrictions

## Corporate Website
- 7-9 pages: Home, About, Projects, Services, Gallery, Contact, Testimonials
- Lead capture into ERP
- WhatsApp floating chat button
- Basic SEO + Google Analytics

## Development Phases (8 weeks)
1. Requirements, database design, wireframes, UI/UX approval
2. Corporate website development
3. Customer, property, booking, ledger, installment modules
4. Payment verification, receipts, invoices, reports
5. Notifications, security, roles, audit logs, backups
6. Testing, UAT, deployment, training, launch

## Quick Commands
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Run Django server
python manage.py runserver

# Create Django project (when ready)
django-admin startproject samana_erp .

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## Key Conventions
- Auto-generated Customer IDs
- Payment workflow: Pending Verification → Paid/Rejected/Overdue
- Role-based access control for all modules
- Branded PDF documents for receipts/invoices
