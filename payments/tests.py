from django.test import TestCase, Client
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import date
from .models import Payment, Receipt
from .forms import PaymentForm
from .serializers import PaymentVerificationSerializer
from customers.models import Customer
from properties.models import Project, Plot
from bookings.models import Booking


class PaymentFormTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
        self.customer = Customer.objects.create(
            first_name='Ahmed', last_name='Khan',
            phone='+92-300-1234567', cnic='35202-1234567-1',
            created_by=self.user
        )
        self.project = Project.objects.create(name='Test', location='Lahore')
        self.plot = Plot.objects.create(
            plot_number='A-101', project=self.project,
            size_marla=Decimal('5.00'), price=Decimal('5000000')
        )
        self.booking = Booking.objects.create(
            customer=self.customer, plot=self.plot,
            total_amount=Decimal('5000000'), created_by=self.user
        )
    
    def test_valid_payment_form(self):
        form_data = {
            'booking': self.booking.pk,
            'amount': '100000',
            'payment_date': date.today().isoformat(),
            'payment_method': 'cash'
        }
        form = PaymentForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_invalid_amount(self):
        form_data = {
            'booking': self.booking.pk,
            'amount': '-100',
            'payment_date': date.today().isoformat(),
            'payment_method': 'cash'
        }
        form = PaymentForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('amount', form.errors)


class PaymentViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user('testuser', 'test@example.com', 'testpass123', is_superuser=True)
        self.client.login(username='testuser', password='testpass123')
        self.customer = Customer.objects.create(
            first_name='Ahmed', last_name='Khan',
            phone='+92-300-1234567', cnic='35202-1234567-1',
            created_by=self.user
        )
        self.project = Project.objects.create(name='Test', location='Lahore')
        self.plot = Plot.objects.create(
            plot_number='A-101', project=self.project,
            size_marla=Decimal('5.00'), price=Decimal('5000000')
        )
        self.booking = Booking.objects.create(
            customer=self.customer, plot=self.plot,
            total_amount=Decimal('5000000'), created_by=self.user
        )
    
    def test_payment_list_view(self):
        response = self.client.get('/payments/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Payments')
    
    def test_payment_create_view(self):
        response = self.client.get('/payments/create/')
        self.assertEqual(response.status_code, 200)
    
    def test_payment_create_post(self):
        response = self.client.post('/payments/create/', {
            'booking': self.booking.pk,
            'amount': '100000',
            'payment_date': date.today().isoformat(),
            'payment_method': 'cash'
        })
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Payment.objects.count(), 1)
    
    def test_payment_verify_view(self):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('100000'),
            payment_date=date.today(),
            payment_method='cash',
            created_by=self.user
        )
        response = self.client.get(f'/payments/{payment.pk}/verify/')
        self.assertEqual(response.status_code, 200)
    
    def test_payment_verification_post(self):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('100000'),
            payment_date=date.today(),
            payment_method='cash',
            created_by=self.user
        )
        response = self.client.post(f'/payments/{payment.pk}/verify/', {
            'action': 'verify',
            'notes': 'Payment verified'
        })
        self.assertEqual(response.status_code, 302)
        
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'verified')
        
        # Check booking advance updated
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.advance_paid, Decimal('100000'))
    
    def test_payment_rejection(self):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('100000'),
            payment_date=date.today(),
            payment_method='cash',
            created_by=self.user
        )
        response = self.client.post(f'/payments/{payment.pk}/verify/', {
            'action': 'reject',
            'notes': 'Invalid payment'
        })
        self.assertEqual(response.status_code, 302)
        
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'rejected')
