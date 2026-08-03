# Design: ERP Login Button in Corporate Website Navbar

**Date:** 2026-08-03
**Status:** Approved
**Scope:** Add a button to the React corporate website that opens the Django ERP login in a new tab.

## Problem

The corporate website (React/Vite at port 5173) has no way for staff to reach the fully-functional Django server-rendered ERP (port 8000). Visitors/staff must manually type the ERP URL. We need a single, discoverable button that takes the user to the ERP login.

## Decision

- Point to the **Django ERP** at `http://127.0.0.1:8000/login/` (the working ERP with payments, receipts, audit logs, etc.), NOT the React `/erp` section (whose login is currently simulated).
- Place the button in the **Navbar** (desktop right-side cluster and mobile menu).
- Button opens the ERP login in a **new browser tab**.
- Use **Approach A**: a Vite environment variable + small config module as the single source of truth for the ERP URL.

## Architecture

### Components

1. **`frontend/src/config.js`** (new)
   - Exports `ERP_LOGIN_URL` computed as `(import.meta.env.VITE_ERP_URL || 'http://localhost:8000') + '/login/'`.
   - Single source of truth; switching environments only requires changing the env var.

2. **`frontend/.env.development`** (new)
   - `VITE_ERP_URL=http://localhost:8000`
   - (Production would set its own `VITE_ERP_URL` at build time.)

3. **`frontend/src/components/layout/Navbar.jsx`** (edit)
   - Import `ERP_LOGIN_URL` from `../config.js`.
   - Add a "Staff Login" button in the desktop right-side action cluster (next to "Book Now") and in the mobile menu.
   - Render as `<a href={ERP_LOGIN_URL} target="_blank" rel="noopener noreferrer">` styled consistently with existing navbar buttons.

### Data flow

Button click → browser opens `http://localhost:8000/login/` in a new tab → Django login page renders.

## Error handling / edge cases

- No runtime error handling needed — a plain anchor link.
- If `VITE_ERP_URL` is unset, the default `http://localhost:8000` is used so dev works out of the box.

## Testing

- Manual (CDP) verification: load the corporate site at `http://127.0.0.1:5173`, confirm the Navbar shows "Staff Login", click it, confirm the Django login page loads in a new tab.
- Confirm the button appears in both desktop navbar and mobile menu.
