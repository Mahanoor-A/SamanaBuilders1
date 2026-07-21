# Samana Builders ERP - Test Plan

## Test Scenarios

### 1. Authentication Tests
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Access protected pages without login (redirect to login)

### 2. Customer Management Tests
- [ ] Create new customer with valid data
- [ ] Create customer with duplicate CNIC (should fail)
- [ ] Create customer with invalid phone format (should fail)
- [ ] Edit existing customer
- [ ] Delete customer
- [ ] Search customers by ID, name, phone, CNIC

### 3. Property Management Tests
- [ ] Create new project
- [ ] Edit project
- [ ] Delete project
- [ ] Create new plot
- [ ] Edit plot
- [ ] Delete plot
- [ ] Filter plots by project and status

### 4. Booking Management Tests
- [ ] Create new booking
- [ ] Booking auto-generates booking ID
- [ ] Booking updates plot status to 'booked'
- [ ] View booking detail
- [ ] Edit booking
- [ ] Delete booking (resets plot status)
- [ ] Filter bookings by status

### 5. Payment Management Tests
- [ ] Record new payment
- [ ] Verify payment (updates booking advance)
- [ ] Reject payment
- [ ] Filter payments by status
- [ ] Payment audit trail

### 6. Role-Based Access Tests
- [ ] Sales role: Can view customers, properties, bookings
- [ ] Accounts role: Can verify payments
- [ ] Management role: Can manage users
- [ ] Unauthorized access shows error message

### 7. API Tests
- [ ] GET /api/customers/ (list)
- [ ] POST /api/customers/ (create)
- [ ] GET /api/bookings/ (list)
- [ ] POST /api/bookings/ (create)
- [ ] GET /api/payments/ (list)
- [ ] POST /api/payments/ (create)
- [ ] POST /api/payments/{id}/verify/ (verify payment)

### 8. Dashboard Tests
- [ ] Stats display correctly
- [ ] Recent bookings show
- [ ] Recent payments show
- [ ] Quick action buttons work

## Test Data

### Sample Customer
```json
{
    "first_name": "Ahmed",
    "last_name": "Khan",
    "email": "ahmed@example.com",
    "phone": "+92-300-1234567",
    "cnic": "35202-1234567-1"
}
```

### Sample Project
```json
{
    "name": "Samana Green Heights",
    "description": "Premium residential project",
    "location": "Lahore",
    "total_plots": 100
}
```

### Sample Plot
```json
{
    "plot_number": "A-101",
    "plot_type": "residential",
    "size_marla": 5,
    "price": 5000000
}
```

### Sample Booking
```json
{
    "total_amount": 5000000,
    "advance_paid": 500000
}
```

### Sample Payment
```json
{
    "amount": 100000,
    "payment_date": "2026-07-21",
    "payment_method": "cash"
}
```
