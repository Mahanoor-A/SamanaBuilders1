from django.test import TestCase
from django.contrib.auth.models import User
from datetime import date, timedelta
from decimal import Decimal
from core.models import UserProfile, AuditLog
from customers.models import Customer
from properties.models import Project, Plot
from bookings.models import Booking, InstallmentPlan, Installment
from payments.models import Payment, Receipt


class CustomerModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
    
    def test_customer_creation(self):
        customer = Customer.objects.create(
            first_name='Ahmed',
            last_name='Khan',
            phone='+92-300-1234567',
            cnic='35202-1234567-1',
            email='ahmed@example.com',
            created_by=self.user
        )
        self.assertEqual(customer.customer_id, 'CUS-00001')
        self.assertEqual(customer.full_name, 'Ahmed Khan')
    
    def test_customer_id_auto_increment(self):
        c1 = Customer.objects.create(
            first_name='Test1', last_name='User1',
            phone='+92-300-1111111', cnic='35202-1111111-1',
            created_by=self.user
        )
        c2 = Customer.objects.create(
            first_name='Test2', last_name='User2',
            phone='+92-300-2222222', cnic='35202-2222222-2',
            created_by=self.user
        )
        self.assertEqual(c1.customer_id, 'CUS-00001')
        self.assertEqual(c2.customer_id, 'CUS-00002')


class ProjectModelTest(TestCase):
    def test_project_creation(self):
        project = Project.objects.create(
            name='Test Project',
            location='Lahore',
            total_plots=100
        )
        self.assertEqual(project.name, 'Test Project')
        self.assertTrue(project.is_active)


class PlotModelTest(TestCase):
    def setUp(self):
        self.project = Project.objects.create(
            name='Test Project',
            location='Lahore',
            total_plots=100
        )
    
    def test_plot_creation(self):
        plot = Plot.objects.create(
            plot_number='A-101',
            project=self.project,
            plot_type='residential',
            size_marla=Decimal('5.00'),
            price=Decimal('5000000'),
            status='available'
        )
        self.assertEqual(plot.plot_number, 'A-101')
        self.assertEqual(plot.status, 'available')
    
    def test_plot_unique_together(self):
        Plot.objects.create(
            plot_number='A-101',
            project=self.project,
            size_marla=Decimal('5.00'),
            price=Decimal('5000000')
        )
        with self.assertRaises(Exception):
            Plot.objects.create(
                plot_number='A-101',
                project=self.project,
                size_marla=Decimal('5.00'),
                price=Decimal('5000000')
            )


class BookingModelTest(TestCase):
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
    
    def test_booking_creation(self):
        booking = Booking.objects.create(
            customer=self.customer,
            plot=self.plot,
            total_amount=Decimal('5000000'),
            advance_paid=Decimal('500000'),
            created_by=self.user
        )
        self.assertEqual(booking.booking_id, 'BKG-00001')
        self.assertEqual(booking.remaining_balance, Decimal('4500000'))
    
    def test_booking_id_auto_increment(self):
        b1 = Booking.objects.create(
            customer=self.customer, plot=self.plot,
            total_amount=Decimal('5000000'), created_by=self.user
        )
        self.assertEqual(b1.booking_id, 'BKG-00001')


class PaymentModelTest(TestCase):
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
    
    def test_payment_creation(self):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('100000'),
            payment_date=date.today(),
            payment_method='cash',
            created_by=self.user
        )
        self.assertEqual(payment.payment_id, 'PAY-00001')
        self.assertEqual(payment.status, 'pending')
    
    def test_payment_verification(self):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=Decimal('100000'),
            payment_date=date.today(),
            payment_method='cash',
            created_by=self.user
        )
        payment.status = 'verified'
        payment.verified_by = self.user
        payment.save()
        
        self.booking.advance_paid += payment.amount
        self.booking.save()
        
        self.assertEqual(payment.status, 'verified')
        self.assertEqual(self.booking.advance_paid, Decimal('100000'))


class UserProfileTest(TestCase):
    def test_user_profile_creation(self):
        user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
        profile = UserProfile.objects.create(
            user=user,
            role='sales',
            phone='+92-300-1234567'
        )
        self.assertEqual(profile.role, 'sales')
        # get_full_name() returns empty if no first/last name set
        self.assertIn('Sales', str(profile))


class AuditLogTest(TestCase):
    def test_audit_log_creation(self):
        user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
        log = AuditLog.objects.create(
            user=user,
            action='create',
            model_name='Customer',
            object_id='CUS-00001',
            description='Created customer Ahmed Khan'
        )
        self.assertEqual(log.action, 'create')
        self.assertEqual(log.model_name, 'Customer')
