from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import UserProfile, AuditLog
from .forms import UserForm, UserProfileForm, CreateUserForm
from .permissions import role_required, sales_or_admin, accounts_or_admin, management_or_admin
from customers.models import Customer
from properties.models import Project, Plot
from bookings.models import Booking, Installment
from payments.models import Payment


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            AuditLog.objects.create(
                user=user, action='login', model_name='User',
                description=f'{user.username} logged in',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            messages.success(request, f'Welcome back, {user.get_full_name() or user.username}!')
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()
    
    return render(request, 'login.html', {'form': form})


def logout_view(request):
    if request.user.is_authenticated:
        AuditLog.objects.create(
            user=request.user, action='logout', model_name='User',
            description=f'{request.user.username} logged out',
            ip_address=request.META.get('REMOTE_ADDR')
        )
    logout(request)
    return redirect('login')


@login_required
def dashboard_view(request):
    today = timezone.now().date()
    month_ago = today - timedelta(days=30)
    
    context = {
        'total_customers': Customer.objects.count(),
        'active_customers': Customer.objects.filter(is_active=True).count(),
        'total_projects': Project.objects.filter(is_active=True).count(),
        'total_plots': Plot.objects.count(),
        'available_plots': Plot.objects.filter(status='available').count(),
        'booked_plots': Plot.objects.filter(status='booked').count(),
        'sold_plots': Plot.objects.filter(status='sold').count(),
        'total_bookings': Booking.objects.count(),
        'pending_bookings': Booking.objects.filter(status='pending').count(),
        'confirmed_bookings': Booking.objects.filter(status='confirmed').count(),
        'total_payments': Payment.objects.count(),
        'pending_payments': Payment.objects.filter(status='pending').count(),
        'verified_payments': Payment.objects.filter(status='verified').count(),
        'total_revenue': Payment.objects.filter(status='verified').aggregate(total=Sum('amount'))['total'] or 0,
        'monthly_revenue': Payment.objects.filter(
            status='verified', payment_date__gte=month_ago
        ).aggregate(total=Sum('amount'))['total'] or 0,
        'recent_bookings': Booking.objects.select_related('customer', 'plot').order_by('-created_at')[:5],
        'recent_payments': Payment.objects.select_related('booking').order_by('-created_at')[:5],
        'overdue_installments': Installment.objects.filter(status='overdue').count(),
    }
    return render(request, 'dashboard.html', context)


@login_required
def customers_view(request):
    search = request.GET.get('search', '')
    customers = Customer.objects.all()
    
    if search:
        customers = customers.filter(
            Q(customer_id__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(phone__icontains=search) |
            Q(cnic__icontains=search)
        )
    
    context = {
        'customers': customers,
        'search': search,
        'total_count': Customer.objects.count(),
    }
    return render(request, 'customers.html', context)


@login_required
def customer_create_view(request):
    from customers.forms import CustomerForm
    
    if request.method == 'POST':
        form = CustomerForm(request.POST)
        if form.is_valid():
            customer = form.save(commit=False)
            customer.created_by = request.user
            customer.save()
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Customer',
                object_id=customer.customer_id,
                description=f'Created customer {customer.full_name}'
            )
            messages.success(request, f'Customer {customer.customer_id} created successfully!')
            return redirect('customers')
    else:
        form = CustomerForm()
    
    return render(request, 'customer_form.html', {'form': form, 'title': 'Add New Customer'})


@login_required
def customer_edit_view(request, pk):
    from customers.forms import CustomerForm
    
    customer = get_object_or_404(Customer, pk=pk)
    if request.method == 'POST':
        form = CustomerForm(request.POST, instance=customer)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='Customer',
                object_id=customer.customer_id,
                description=f'Updated customer {customer.full_name}'
            )
            messages.success(request, f'Customer {customer.customer_id} updated successfully!')
            return redirect('customers')
    else:
        form = CustomerForm(instance=customer)
    
    return render(request, 'customer_form.html', {'form': form, 'title': f'Edit Customer {customer.customer_id}', 'customer': customer})


@login_required
def customer_delete_view(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    if request.method == 'POST':
        customer_id = customer.customer_id
        customer.delete()
        AuditLog.objects.create(
            user=request.user, action='delete', model_name='Customer',
            object_id=customer_id,
            description=f'Deleted customer {customer_id}'
        )
        messages.success(request, f'Customer {customer_id} deleted successfully!')
        return redirect('customers')
    
    return render(request, 'confirm_delete.html', {'object': customer, 'title': 'Delete Customer', 'cancel_url': 'customers'})


@login_required
def properties_view(request):
    projects = Project.objects.all()
    plots = Plot.objects.select_related('project').all()
    
    project_filter = request.GET.get('project', '')
    status_filter = request.GET.get('status', '')
    
    if project_filter:
        plots = plots.filter(project_id=project_filter)
    if status_filter:
        plots = plots.filter(status=status_filter)
    
    context = {
        'projects': projects,
        'plots': plots,
        'project_filter': project_filter,
        'status_filter': status_filter,
    }
    return render(request, 'properties.html', context)


@login_required
def project_create_view(request):
    from properties.forms import ProjectForm
    
    if request.method == 'POST':
        form = ProjectForm(request.POST)
        if form.is_valid():
            project = form.save()
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Project',
                object_id=str(project.id),
                description=f'Created project {project.name}'
            )
            messages.success(request, f'Project "{project.name}" created successfully!')
            return redirect('properties')
    else:
        form = ProjectForm()
    
    return render(request, 'project_form.html', {'form': form, 'title': 'Add New Project'})


@login_required
def project_edit_view(request, pk):
    from properties.forms import ProjectForm
    
    project = get_object_or_404(Project, pk=pk)
    if request.method == 'POST':
        form = ProjectForm(request.POST, instance=project)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='Project',
                object_id=str(project.id),
                description=f'Updated project {project.name}'
            )
            messages.success(request, f'Project "{project.name}" updated successfully!')
            return redirect('properties')
    else:
        form = ProjectForm(instance=project)
    
    return render(request, 'project_form.html', {'form': form, 'title': f'Edit Project', 'project': project})


@login_required
def project_delete_view(request, pk):
    project = get_object_or_404(Project, pk=pk)
    if request.method == 'POST':
        project_name = project.name
        project.delete()
        AuditLog.objects.create(
            user=request.user, action='delete', model_name='Project',
            object_id=str(pk),
            description=f'Deleted project {project_name}'
        )
        messages.success(request, f'Project "{project_name}" deleted successfully!')
        return redirect('properties')
    
    return render(request, 'confirm_delete.html', {'object': project, 'title': 'Delete Project', 'cancel_url': 'properties'})


@login_required
def plot_create_view(request):
    from properties.forms import PlotForm
    
    if request.method == 'POST':
        form = PlotForm(request.POST)
        if form.is_valid():
            plot = form.save()
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Plot',
                object_id=str(plot.id),
                description=f'Created plot {plot.plot_number} in {plot.project.name}'
            )
            messages.success(request, f'Plot {plot.plot_number} created successfully!')
            return redirect('properties')
    else:
        form = PlotForm()
    
    return render(request, 'plot_form.html', {'form': form, 'title': 'Add New Plot'})


@login_required
def plot_edit_view(request, pk):
    from properties.forms import PlotForm
    
    plot = get_object_or_404(Plot, pk=pk)
    if request.method == 'POST':
        form = PlotForm(request.POST, instance=plot)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='Plot',
                object_id=str(plot.id),
                description=f'Updated plot {plot.plot_number}'
            )
            messages.success(request, f'Plot {plot.plot_number} updated successfully!')
            return redirect('properties')
    else:
        form = PlotForm(instance=plot)
    
    return render(request, 'plot_form.html', {'form': form, 'title': f'Edit Plot', 'plot': plot})


@login_required
def plot_delete_view(request, pk):
    plot = get_object_or_404(Plot, pk=pk)
    if request.method == 'POST':
        plot_info = f'{plot.plot_number} ({plot.project.name})'
        plot.delete()
        AuditLog.objects.create(
            user=request.user, action='delete', model_name='Plot',
            object_id=str(pk),
            description=f'Deleted plot {plot_info}'
        )
        messages.success(request, f'Plot deleted successfully!')
        return redirect('properties')
    
    return render(request, 'confirm_delete.html', {'object': plot, 'title': 'Delete Plot', 'cancel_url': 'properties'})


@login_required
def bookings_view(request):
    bookings = Booking.objects.select_related('customer', 'plot').all()
    status_filter = request.GET.get('status', '')
    
    if status_filter:
        bookings = bookings.filter(status=status_filter)
    
    context = {
        'bookings': bookings,
        'status_filter': status_filter,
    }
    return render(request, 'bookings.html', context)


@login_required
def booking_create_view(request):
    from bookings.forms import BookingForm
    
    if request.method == 'POST':
        form = BookingForm(request.POST)
        if form.is_valid():
            booking = form.save(commit=False)
            booking.created_by = request.user
            booking.save()
            
            # Update plot status
            plot = booking.plot
            plot.status = 'booked'
            plot.save()
            
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Booking',
                object_id=booking.booking_id,
                description=f'Created booking {booking.booking_id} for {booking.customer.full_name}'
            )
            messages.success(request, f'Booking {booking.booking_id} created successfully!')
            return redirect('bookings')
    else:
        form = BookingForm()
    
    return render(request, 'booking_form.html', {'form': form, 'title': 'Create New Booking'})


@login_required
def booking_detail_view(request, pk):
    booking = get_object_or_404(
        Booking.objects.select_related('customer', 'plot', 'plot__project'),
        pk=pk
    )
    installments = booking.installment_plan.installments.all() if hasattr(booking, 'installment_plan') else []
    payments = booking.payments.all()
    
    context = {
        'booking': booking,
        'installments': installments,
        'payments': payments,
    }
    return render(request, 'booking_detail.html', context)


@login_required
def booking_edit_view(request, pk):
    from bookings.forms import BookingForm
    
    booking = get_object_or_404(Booking, pk=pk)
    if request.method == 'POST':
        form = BookingForm(request.POST, instance=booking)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='Booking',
                object_id=booking.booking_id,
                description=f'Updated booking {booking.booking_id}'
            )
            messages.success(request, f'Booking {booking.booking_id} updated successfully!')
            return redirect('bookings')
    else:
        form = BookingForm(instance=booking)
    
    return render(request, 'booking_form.html', {'form': form, 'title': f'Edit Booking', 'booking': booking})


@login_required
def booking_delete_view(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    if request.method == 'POST':
        booking_id = booking.booking_id
        # Reset plot status
        plot = booking.plot
        plot.status = 'available'
        plot.save()
        booking.delete()
        AuditLog.objects.create(
            user=request.user, action='delete', model_name='Booking',
            object_id=booking_id,
            description=f'Deleted booking {booking_id}'
        )
        messages.success(request, f'Booking {booking_id} deleted successfully!')
        return redirect('bookings')
    
    return render(request, 'confirm_delete.html', {'object': booking, 'title': 'Delete Booking', 'cancel_url': 'bookings'})


@login_required
def payments_view(request):
    payments = Payment.objects.select_related('booking', 'booking__customer').all()
    status_filter = request.GET.get('status', '')
    
    if status_filter:
        payments = payments.filter(status=status_filter)
    
    context = {
        'payments': payments,
        'status_filter': status_filter,
    }
    return render(request, 'payments.html', context)


@login_required
def payment_create_view(request):
    from payments.forms import PaymentForm
    
    if request.method == 'POST':
        form = PaymentForm(request.POST)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.created_by = request.user
            payment.save()
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Payment',
                object_id=payment.payment_id,
                description=f'Created payment {payment.payment_id} for booking {payment.booking.booking_id}'
            )
            messages.success(request, f'Payment {payment.payment_id} created successfully!')
            return redirect('payments')
    else:
        form = PaymentForm()
    
    return render(request, 'payment_form.html', {'form': form, 'title': 'Record New Payment'})


@login_required
@accounts_or_admin
def payment_verify_view(request, pk):
    from payments.forms import PaymentVerificationForm
    
    payment = get_object_or_404(Payment, pk=pk)
    
    if request.method == 'POST':
        form = PaymentVerificationForm(request.POST)
        if form.is_valid():
            action = form.cleaned_data['action']
            notes = form.cleaned_data['notes']
            
            if action == 'verify':
                payment.status = 'verified'
                payment.verified_by = request.user
                payment.verified_at = timezone.now()
                payment.notes = notes
                
                # Update installment if linked
                if payment.installment:
                    installment = payment.installment
                    installment.paid_amount += payment.amount
                    if installment.paid_amount >= installment.amount:
                        installment.status = 'paid'
                        installment.paid_date = payment.payment_date
                    else:
                        installment.status = 'partial'
                    installment.save()
                
                # Update booking advance
                booking = payment.booking
                booking.advance_paid += payment.amount
                booking.save()
                
                messages.success(request, f'Payment {payment.payment_id} verified successfully!')
            else:
                payment.status = 'rejected'
                payment.verified_by = request.user
                payment.verified_at = timezone.now()
                payment.notes = notes
                messages.warning(request, f'Payment {payment.payment_id} rejected.')
            
            payment.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='Payment',
                object_id=payment.payment_id,
                description=f'{action.title()} payment {payment.payment_id}'
            )
            return redirect('payments')
    else:
        form = PaymentVerificationForm()
    
    return render(request, 'payment_verify.html', {'form': form, 'payment': payment})


@login_required
def payment_delete_view(request, pk):
    payment = get_object_or_404(Payment, pk=pk)
    if request.method == 'POST':
        payment_id = payment.payment_id
        payment.delete()
        AuditLog.objects.create(
            user=request.user, action='delete', model_name='Payment',
            object_id=payment_id,
            description=f'Deleted payment {payment_id}'
        )
        messages.success(request, f'Payment {payment_id} deleted successfully!')
        return redirect('payments')
    
    return render(request, 'confirm_delete.html', {'object': payment, 'title': 'Delete Payment', 'cancel_url': 'payments'})


@login_required
@management_or_admin
def users_view(request):
    users = User.objects.select_related('profile').all()
    return render(request, 'users.html', {'users': users})


@login_required
@management_or_admin
def user_create_view(request):
    from .forms import CreateUserForm
    
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            user = User.objects.create_user(
                username=form.cleaned_data['username'],
                email=form.cleaned_data['email'],
                password=form.cleaned_data['password'],
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
            )
            UserProfile.objects.create(
                user=user,
                role=form.cleaned_data['role'],
                phone=form.cleaned_data['phone'],
            )
            AuditLog.objects.create(
                user=request.user, action='create', model_name='User',
                object_id=user.username,
                description=f'Created user {user.username}'
            )
            messages.success(request, f'User {user.username} created successfully!')
            return redirect('users')
    else:
        form = CreateUserForm()
    
    return render(request, 'user_form.html', {'form': form, 'title': 'Create New User'})


@login_required
@management_or_admin
def audit_logs_view(request):
    logs = AuditLog.objects.select_related('user').all()[:100]
    return render(request, 'audit_logs.html', {'logs': logs})
