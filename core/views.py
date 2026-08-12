from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncWeek, TruncYear
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import UserProfile, AuditLog
from .forms import UserForm, UserProfileForm, CreateUserForm, UserEditForm, RestoreBackupForm
from .permissions import (
    role_required, super_admin_required, admin_or_above,
    management_or_above, finance_or_above, payments_access, get_user_role,
)
from customers.models import Customer
from properties.models import Project, Plot
from bookings.models import Booking, Installment
from payments.models import Payment


def _post_login_target(user):
    """Customers (non-staff) go to the React customer portal; staff go to the ERP dashboard."""
    if user.is_staff or hasattr(user, 'profile'):
        return 'dashboard'
    if Customer.objects.filter(user=user).exists():
        return '/portal'
    return 'dashboard'


def login_view(request):
    if request.user.is_authenticated:
        return redirect(_post_login_target(request.user))
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            
            # Deactivated users cannot log in
            if not user.is_active:
                messages.error(request, 'Your account has been deactivated. Contact an administrator.')
                return render(request, 'login.html', {'form': form})
            
            login(request, user)
            AuditLog.objects.create(
                user=user, action='login', model_name='User',
                description=f'{user.username} logged in',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            messages.success(request, f'Welcome back, {user.get_full_name() or user.username}!')
            return redirect(_post_login_target(user))
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
    month_start = today.replace(day=1)
    
    verified_payments_qs = Payment.objects.filter(status='verified')
    
    # Revenue stats
    total_revenue = verified_payments_qs.aggregate(total=Sum('amount'))['total'] or 0
    monthly_revenue = verified_payments_qs.filter(
        payment_date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue trend (last 6 months)
    six_months_ago = today - timedelta(days=180)
    monthly_data = (
        verified_payments_qs.filter(payment_date__gte=six_months_ago)
        .annotate(month=TruncMonth('payment_date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )
    monthly_revenue_data = []
    max_amount = 1
    for entry in monthly_data:
        amt = float(entry['total'])
        if amt > max_amount:
            max_amount = amt
        monthly_revenue_data.append({
            'label': entry['month'].strftime('%b %Y'),
            'amount': amt,
        })
    for item in monthly_revenue_data:
        item['pct'] = round((item['amount'] / max_amount) * 100, 1)
    
    # Booking stats
    pending_bookings = Booking.objects.filter(status='pending').count()
    active_bookings = Booking.objects.filter(status='active').count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    completed_bookings = Booking.objects.filter(status='completed').count()
    cancelled_bookings = Booking.objects.filter(status='cancelled').count()
    
    # Payment stats
    pending_payments = Payment.objects.filter(status='pending').count()
    verified_payments = verified_payments_qs.count()
    
    # Property stats
    available_plots = Plot.objects.filter(status='available').count()
    booked_plots = Plot.objects.filter(status='booked').count()
    sold_plots = Plot.objects.filter(status='sold').count()
    
    plot_status_data = [
        {'label': 'Available', 'count': available_plots, 'color': '#10b981'},
        {'label': 'Booked', 'count': booked_plots, 'color': '#3b82f6'},
        {'label': 'Sold', 'count': sold_plots, 'color': '#f59e0b'},
    ]
    
    # Installment stats
    overdue_installments = Installment.objects.filter(status='overdue').count()
    paid_installments = Installment.objects.filter(status='paid').count()
    pending_installments = Installment.objects.filter(status='pending').count()
    partial_installments = Installment.objects.filter(status='partial').count()
    
    installment_status_data = [
        {'label': 'Paid', 'count': paid_installments, 'color': '#10b981'},
        {'label': 'Overdue', 'count': overdue_installments, 'color': '#ef4444'},
        {'label': 'Pending', 'count': pending_installments, 'color': '#f59e0b'},
        {'label': 'Partial', 'count': partial_installments, 'color': '#3b82f6'},
    ]
    
    # Collection rate
    total_installment_amount = Installment.objects.aggregate(total=Sum('amount'))['total'] or 1
    total_paid_amount = Installment.objects.aggregate(total=Sum('paid_amount'))['total'] or 0
    collection_rate = round((total_paid_amount / total_installment_amount) * 100, 1)
    if collection_rate > 100:
        collection_rate = 100
    
    # Payment method breakdown
    method_data = (
        verified_payments_qs.values('payment_method')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    method_labels = dict(Payment.METHOD_CHOICES)
    payment_method_data = [
        {'method': method_labels.get(m['payment_method'], m['payment_method']), 'total': float(m['total'])}
        for m in method_data
    ]
    
    # Plots by project
    plots_by_project = (
        Plot.objects.values('project__name')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    plots_by_project_data = [
        {'project': p['project__name'], 'count': p['count']}
        for p in plots_by_project
    ]
    
    # Booking status for doughnut
    booking_status_data = [
        {'label': 'Completed', 'count': completed_bookings, 'color': '#10b981'},
        {'label': 'Active', 'count': active_bookings, 'color': '#3b82f6'},
        {'label': 'Pending', 'count': pending_bookings, 'color': '#f59e0b'},
        {'label': 'Cancelled', 'count': cancelled_bookings, 'color': '#ef4444'},
    ]
    
    # Booking sources
    source_data = (
        Booking.objects.values('source')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    source_labels = dict(Booking.SOURCE_CHOICES)
    booking_source_data = [
        {'source': source_labels.get(s['source'], s['source']), 'count': s['count']}
        for s in source_data
    ]
    
    # Payment status breakdown (ERP verification workflow)
    payment_status_qs = (
        Payment.objects.values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    payment_status_labels = dict(Payment.STATUS_CHOICES)
    payment_status_data = [
        {'status': payment_status_labels.get(p['status'], p['status']), 'count': p['count']}
        for p in payment_status_qs
    ]
    
    # Monthly target (20% above average monthly revenue)
    months_with_data = len(monthly_revenue_data) or 1
    monthly_target = round((float(total_revenue) / max(months_with_data, 1)) * 1.2, -4)
    target_remaining = max(monthly_target - float(monthly_revenue), 0)
    
    # Staff vs admin dashboard
    user_role = None
    if hasattr(request.user, 'profile'):
        user_role = request.user.profile.role
    
    context = {
        # Customers
        'total_customers': Customer.objects.count(),
        'active_customers': Customer.objects.filter(is_active=True).count(),
        
        # Projects / Properties
        'total_projects': Project.objects.exclude(status='inactive').count(),
        'total_plots': Plot.objects.count(),
        'available_plots': available_plots,
        'booked_plots': booked_plots,
        'sold_plots': sold_plots,
        'plots_sold': sold_plots,
        
        # Bookings
        'total_bookings': Booking.objects.count(),
        'pending_bookings': pending_bookings,
        'active_bookings': active_bookings,
        'confirmed_bookings': confirmed_bookings,
        'completed_bookings': completed_bookings,
        'cancelled_bookings': cancelled_bookings,
        
        # Payments
        'total_payments': Payment.objects.count(),
        'pending_payments': pending_payments,
        'verified_payments': verified_payments,
        'total_revenue': total_revenue,
        'monthly_revenue': monthly_revenue,
        'monthly_target': monthly_target,
        'target_remaining': target_remaining,
        
        # Installments
        'overdue_installments': overdue_installments,
        'paid_installments': paid_installments,
        'collection_rate': collection_rate,
        
        # Chart data
        'monthly_revenue_data': monthly_revenue_data,
        'booking_status_data': booking_status_data,
        'payment_method_data': payment_method_data,
        'plots_by_project_data': plots_by_project_data,
        'installment_status_data': installment_status_data,
        'plot_status_data': plot_status_data,
        'booking_source_data': booking_source_data,
        'payment_status_data': payment_status_data,
        
        # Recent records
        'recent_bookings': Booking.objects.select_related('customer', 'plot').order_by('-created_at')[:5],
        'recent_payments': Payment.objects.select_related('booking', 'booking__customer').order_by('-created_at')[:5],
        
        # User role for template
        'user_role': user_role,
    }
    return render(request, 'dashboard.html', context)


@login_required
@finance_or_above
def revenue_trend_view(request):
    """JSON endpoint for the revenue trend chart (week / month / year)."""
    period = request.GET.get('period', 'month')
    today = timezone.now().date()

    qs = Payment.objects.filter(status='verified')

    labels = []
    amounts = []

    if period == 'week':
        start = today - timedelta(days=49)
        data = (
            qs.filter(payment_date__gte=start)
            .annotate(bucket=TruncWeek('payment_date'))
            .values('bucket')
            .annotate(total=Sum('amount'))
            .order_by('bucket')
        )
        for entry in data:
            labels.append(entry['bucket'].strftime('%d %b'))
            amounts.append(float(entry['total']))
    elif period == 'year':
        data = (
            qs.annotate(bucket=TruncYear('payment_date'))
            .values('bucket')
            .annotate(total=Sum('amount'))
            .order_by('bucket')
        )
        for entry in data:
            labels.append(entry['bucket'].strftime('%Y'))
            amounts.append(float(entry['total']))
    else:
        start = today - timedelta(days=180)
        data = (
            qs.filter(payment_date__gte=start)
            .annotate(bucket=TruncMonth('payment_date'))
            .values('bucket')
            .annotate(total=Sum('amount'))
            .order_by('bucket')
        )
        for entry in data:
            labels.append(entry['bucket'].strftime('%b %Y'))
            amounts.append(float(entry['total']))

    return JsonResponse({'labels': labels, 'amounts': amounts})


# ─── CUSTOMERS ───────────────────────────────────────────────────────────────────

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
        'active_count': Customer.objects.filter(is_active=True).count(),
        'customers_with_bookings': Customer.objects.filter(bookings__isnull=False).distinct().count(),
    }
    return render(request, 'customers.html', context)


@login_required
def customer_create_view(request):
    from customers.forms import CustomerForm
    
    if request.method == 'POST':
        form = CustomerForm(request.POST, request.FILES)
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
@admin_or_above
def customer_profile_create_view(request):
    """Create a customer portal login linked to an existing Customer."""
    from customers.forms import CustomerProfileForm

    if request.method == 'POST':
        form = CustomerProfileForm(request.POST)
        if form.is_valid():
            user = form.save()
            customer = form.cleaned_data['customer']
            AuditLog.objects.create(
                user=request.user, action='create', model_name='CustomerProfile',
                object_id=customer.customer_id,
                description=f'Created customer profile for {customer.customer_id} ({user.username})'
            )
            messages.success(request, f'Portal login created for {customer.full_name} (username: {user.username}).')
            return redirect('customers')
    else:
        form = CustomerProfileForm()

    return render(request, 'customer_profile_form.html', {
        'form': form,
        'title': 'Create Customer Profile',
    })


@login_required
def customer_edit_view(request, pk):
    from customers.forms import CustomerForm
    
    customer = get_object_or_404(Customer, pk=pk)
    if request.method == 'POST':
        form = CustomerForm(request.POST, request.FILES, instance=customer)
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
@management_or_above
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
def customer_detail_view(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    bookings = customer.bookings.select_related('plot', 'plot__project').all()
    payments = (
        Payment.objects.filter(booking__customer=customer)
        .select_related('booking', 'booking__plot')
        .order_by('-payment_date', '-created_at')
    )
    context = {
        'customer': customer,
        'bookings': bookings,
        'payments': payments,
        'latest_payment': payments.first(),
    }
    return render(request, 'customer_detail.html', context)


# ─── PROPERTIES / PROJECTS / PLOTS ───────────────────────────────────────────────

@login_required
def properties_view(request):
    projects = Project.objects.all()
    plots = Plot.objects.select_related('project').all()
    
    project_filter = request.GET.get('project', '')
    status_filter = request.GET.get('status', '')
    
    if project_filter:
        plots = plots.filter(project_id=project_filter)
        projects = projects.filter(pk=project_filter)
    if status_filter:
        plots = plots.filter(status=status_filter)
    
    context = {
        'projects': projects,
        'plots': plots,
        'project_filter': project_filter,
        'status_filter': status_filter,
        'available_plots_count': plots.filter(status='available').count(),
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
@management_or_above
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
@management_or_above
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


# ─── BOOKINGS ────────────────────────────────────────────────────────────────────

@login_required
def bookings_view(request):
    bookings = Booking.objects.select_related('customer', 'plot', 'plot__project').all()
    status_filter = request.GET.get('status', '')
    search = request.GET.get('search', '').strip()
    
    if status_filter:
        bookings = bookings.filter(status=status_filter)
    if search:
        bookings = bookings.filter(
            Q(booking_id__icontains=search) |
            Q(customer__first_name__icontains=search) |
            Q(customer__last_name__icontains=search) |
            Q(plot__plot_number__icontains=search)
        )
    
    context = {
        'bookings': bookings,
        'status_filter': status_filter,
        'search': search,
        'confirmed_count': bookings.filter(status='confirmed').count(),
        'pending_count': bookings.filter(status='pending').count(),
        'total_amount': bookings.aggregate(total=Sum('total_amount'))['total'] or 0,
    }
    return render(request, 'bookings.html', context)


@login_required
def booking_create_view(request):
    from bookings.forms import BookingForm
    
    customer_id = request.GET.get('customer_id')
    plot_id = request.GET.get('plot_id')
    initial = {}
    if customer_id:
        initial['customer'] = customer_id
    if plot_id:
        initial['plot'] = plot_id
    
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
        form = BookingForm(initial=initial)
    
    return render(request, 'booking_form.html', {'form': form, 'title': 'Create New Booking'})


@login_required
def booking_detail_view(request, pk):
    booking = get_object_or_404(
        Booking.objects.select_related('customer', 'plot', 'plot__project'),
        pk=pk
    )
    installments = booking.installment_plan.installments.all() if hasattr(booking, 'installment_plan') else []
    payments = booking.payments.select_related('verified_by').prefetch_related('receipts').all()
    
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
@management_or_above
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


# ─── BOOKING TRANSFER ──────────────────────────────────────────────────────────

@login_required
@management_or_above
def booking_transfer_view(request, pk):
    from bookings.models import BookingTransfer
    
    booking = get_object_or_404(Booking, pk=pk)
    
    if request.method == 'POST':
        to_customer_id = request.POST.get('to_customer')
        transfer_fee = Decimal(request.POST.get('transfer_fee', '0'))
        handling = request.POST.get('payment_handling', 'transfer')
        notes = request.POST.get('notes', '')
        
        try:
            to_customer = Customer.objects.get(pk=to_customer_id)
            transfer = BookingTransfer.objects.create(
                booking=booking,
                from_customer=booking.customer,
                to_customer=to_customer,
                transfer_fee=transfer_fee,
                previous_payments_handling=handling,
                approved_by=request.user,
                notes=notes,
            )
            # Update booking customer
            old_customer = booking.customer
            booking.customer = to_customer
            booking.save()
            
            AuditLog.objects.create(
                user=request.user, action='transfer', model_name='Booking',
                object_id=booking.booking_id,
                description=f'Transferred booking {booking.booking_id} from {old_customer.full_name} to {to_customer.full_name}'
            )
            messages.success(request, f'Booking transferred successfully!')
            return redirect('booking_detail', pk=booking.pk)
        except Customer.DoesNotExist:
            messages.error(request, 'Customer not found.')
    
    customers = Customer.objects.filter(is_active=True).exclude(pk=booking.customer.pk)
    return render(request, 'booking_transfer.html', {
        'booking': booking,
        'customers': customers,
    })


# ─── RESERVATION ──────────────────────────────────────────────────────────────

@login_required
def reservation_create_view(request):
    from bookings.models import Reservation
    from bookings.forms import ReservationForm
    
    if request.method == 'POST':
        form = ReservationForm(request.POST)
        if form.is_valid():
            reservation = form.save(commit=False)
            reservation.created_by = request.user
            reservation.save()
            
            # Reserve the plot
            plot = reservation.plot
            plot.status = 'reserved'
            plot.save()
            
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Reservation',
                object_id=str(reservation.id),
                description=f'Created reservation for {reservation.customer.full_name} on plot {plot.plot_number}'
            )
            messages.success(request, 'Plot reserved successfully!')
            return redirect('properties')
    else:
        form = ReservationForm()
    
    return render(request, 'reservation_form.html', {'form': form, 'title': 'Create Reservation'})


# ─── PAYMENTS ────────────────────────────────────────────────────────────────────

@login_required
@payments_access  # sales has no access to payment details; staff keeps legacy view access
def payments_view(request):
    payments = Payment.objects.select_related('booking', 'booking__customer').all()
    status_filter = request.GET.get('status', '')
    method_filter = request.GET.get('method', '')
    search = request.GET.get('search', '')
    customer_id = request.GET.get('customer', '')
    
    if status_filter:
        payments = payments.filter(status=status_filter)
    if method_filter:
        payments = payments.filter(payment_method=method_filter)
    if customer_id:
        payments = payments.filter(booking__customer_id=customer_id)
    if search:
        payments = payments.filter(
            Q(payment_id__icontains=search) |
            Q(booking__booking_id__icontains=search) |
            Q(booking__customer__first_name__icontains=search) |
            Q(booking__customer__last_name__icontains=search)
        )
    
    payments = payments.select_related('booking', 'booking__customer', 'booking__plot', 'verified_by').prefetch_related('receipts')

    today = timezone.localdate()
    month_start = today.replace(day=1)
    total_amount = payments.aggregate(total=Sum('amount'))['total'] or 0
    month_amount = payments.filter(payment_date__gte=month_start).aggregate(total=Sum('amount'))['total'] or 0

    context = {
        'payments': payments,
        'status_filter': status_filter,
        'method_filter': method_filter,
        'search': search,
        'customer_filter': Customer.objects.filter(pk=customer_id).first() if customer_id else None,
        'total_count': payments.count(),
        'total_amount': total_amount,
        'month_amount': month_amount,
    }
    return render(request, 'payments.html', context)


@login_required
@payments_access
def payment_create_view(request):
    from payments.forms import PaymentForm
    from payments.models import Receipt, PaymentAttachment
    
    booking_id = request.GET.get('booking_id')
    pre_filled_booking = None
    
    if booking_id:
        pre_filled_booking = get_object_or_404(Booking, pk=booking_id)
    
    if request.method == 'POST':
        form = PaymentForm(request.POST)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.created_by = request.user
            payment.status = 'verified'
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.save()

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
            if booking.remaining_balance <= 0:
                booking.status = 'completed'
            booking.save()

            # Auto-generate receipt
            receipt = Receipt.objects.create(
                payment=payment,
                receipt_date=payment.payment_date,
                generated_by=request.user,
            )
            payment.receipt_generated = True
            payment.save(update_fields=['receipt_generated'])
            
            # Handle file attachments with method-appropriate type
            method_type_map = {
                'cash': 'receipt_image',
                'cheque': 'cheque_image',
                'bank_transfer': 'payment_screenshot',
                'jazzcash': 'payment_screenshot',
                'easypaisa': 'payment_screenshot',
                'raast': 'payment_screenshot',
                'online': 'payment_screenshot',
            }
            files = request.FILES.getlist('attachments')
            for f in files:
                PaymentAttachment.objects.create(
                    payment=payment,
                    file=f,
                    attachment_type=method_type_map.get(payment.payment_method, 'other'),
                    filename=f.name,
                    uploaded_by=request.user,
                )
            
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Payment',
                object_id=payment.payment_id,
                description=f'Created payment {payment.payment_id} for booking {payment.booking.booking_id}'
            )
            messages.success(request, f'Payment {payment.payment_id} recorded successfully! Receipt {receipt.receipt_number} generated.')
            return redirect('payments')
    else:
        form = PaymentForm()
        if pre_filled_booking:
            form.fields['booking'].initial = pre_filled_booking.id
            form.fields['booking'].widget.attrs['disabled'] = True
    
    projects = Project.objects.exclude(status='inactive')
    plots = Plot.objects.all()
    bookings = Booking.objects.filter(status__in=['pending', 'confirmed', 'active']).select_related('customer', 'plot', 'plot__project')
    
    return render(request, 'payment_form.html', {
        'form': form,
        'title': 'Receive Payment' if pre_filled_booking else 'Record New Payment',
        'projects': projects,
        'plots': plots,
        'bookings': bookings,
        'pre_filled_booking': pre_filled_booking,
    })


@login_required
@payments_access
def payment_detail_view(request, pk):
    payment = get_object_or_404(Payment.objects.select_related(
        'booking', 'booking__customer', 'booking__plot', 'booking__plot__project',
        'installment', 'created_by', 'verified_by'
    ).prefetch_related('receipts'), pk=pk)
    
    installments = []
    payment_summary = None
    plan = getattr(payment.booking, 'installment_plan', None)
    
    if plan:
        installments = plan.installments.all().order_by('installment_number')
        total_paid = float(payment.booking.advance_paid)
        progress = payment.booking.payment_progress
        paid_count = installments.filter(status='paid').count()
        payment_summary = {
            'property_price': float(payment.booking.total_amount),
            'down_payment': float(plan.down_payment_amount),
            'total_paid': total_paid,
            'remaining': float(payment.booking.remaining_balance),
            'total_installments': plan.total_installments,
            'installment_amount': float(plan.installment_amount),
            'paid_installments': paid_count,
            'remaining_installments': plan.total_installments - paid_count,
            'progress': progress,
            'is_fully_paid': payment.booking.remaining_balance <= 0,
        }
    
    all_attachments = payment.attachments.all()
    
    customer_payments = (
        Payment.objects.filter(booking__customer=payment.booking.customer)
        .select_related('booking')
        .order_by('-payment_date', '-created_at')
    )
    
    return render(request, 'payment_detail.html', {
        'payment': payment,
        'installments': installments,
        'payment_summary': payment_summary,
        'attachments': all_attachments,
        'customer_payments': customer_payments,
    })


# ─── RECEIPTS ─────────────────────────────────────────────────────────────────────

@login_required
@payments_access
def receipt_detail_view(request, pk):
    from payments.models import Receipt
    from payments.utils import amount_in_words
    
    receipt = get_object_or_404(
        Receipt.objects.select_related(
            'payment', 'payment__booking', 'payment__booking__customer',
            'payment__booking__plot', 'payment__booking__plot__project',
            'generated_by'
        ),
        pk=pk
    )
    
    payment = receipt.payment
    booking = payment.booking
    amount_words = amount_in_words(payment.amount)
    
    return render(request, 'receipt_detail.html', {
        'receipt': receipt,
        'payment': payment,
        'booking': booking,
        'amount_words': amount_words,
    })


# ─── USERS (admin/super_admin only; management read-only) ──────────────────────────

@login_required
@management_or_above
def users_view(request):
    users = User.objects.select_related('profile').order_by('-date_joined')
    role_choices = [(k, v) for k, v in UserProfile.ROLE_CHOICES if k != 'super_admin']
    return render(request, 'users.html', {
        'users': users,
        'role_choices': role_choices,
        'active_count': User.objects.filter(is_active=True).count(),
        'admin_count': User.objects.filter(profile__role__in=['super_admin', 'admin']).count(),
    })


@login_required
@admin_or_above
def user_create_view(request):
    from .forms import CreateUserForm

    if request.method == 'POST':
        form = CreateUserForm(request.POST, actor=request.user)
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
                phone=form.cleaned_data.get('phone', ''),
                cnic=form.cleaned_data.get('cnic', ''),
            )
            AuditLog.objects.create(
                user=request.user, action='create', model_name='User',
                object_id=user.username,
                description=f'Created user {user.username} with role {form.cleaned_data["role"]}'
            )
            messages.success(request, f'User {user.username} created successfully!')
            return redirect('users')
    else:
        form = CreateUserForm()

    return render(request, 'user_form.html', {'form': form, 'title': 'Create New User'})


@login_required
@admin_or_above
def user_edit_view(request, pk):
    user = get_object_or_404(User.objects.select_related('profile'), pk=pk)
    actor_role = get_user_role(request)
    target_role = getattr(getattr(user, 'profile', None), 'role', None)

    if target_role == 'super_admin' and actor_role != 'super_admin':
        messages.error(request, 'Only a Super Admin can edit a Super Admin account.')
        return redirect('users')

    if request.method == 'POST':
        form = UserEditForm(request.POST, instance=user)
        if form.is_valid():
            new_role = form.cleaned_data['role']

            if user == request.user and new_role != target_role:
                form.add_error('role', 'You cannot change your own role.')
            elif (
                target_role == 'super_admin'
                and new_role != 'super_admin'
                and User.objects.filter(is_active=True, profile__role='super_admin').count() <= 1
            ):
                form.add_error('role', 'Cannot change the role of the last active Super Admin.')
            else:
                password_changed = bool(form.cleaned_data.get('new_password'))
                form.save()
                AuditLog.objects.create(
                    user=request.user, action='update', model_name='User',
                    object_id=user.username,
                    description=f'Updated user {user.username}' + (' and changed password' if password_changed else '')
                )
                messages.success(request, f'User {user.username} updated successfully!')
                return redirect('users')
    else:
        form = UserEditForm(instance=user)

    return render(request, 'user_form.html', {'form': form, 'title': f'Edit User: {user.username}', 'user': user})


@login_required
@admin_or_above
def user_role_update_view(request, pk):
    """Inline role dropdown update from the Manage Users list."""
    user = get_object_or_404(User.objects.select_related('profile'), pk=pk)
    allowed = [k for k, _ in UserProfile.ROLE_CHOICES if k != 'super_admin']

    if request.method == 'POST':
        role = request.POST.get('role', '')
        if user == request.user:
            messages.error(request, 'You cannot change your own role.')
        elif not hasattr(user, 'profile'):
            messages.error(request, f'User {user.username} has no profile.')
        elif getattr(user.profile, 'role', None) == 'super_admin':
            messages.error(request, 'Super Admin roles cannot be changed.')
        elif role not in allowed:
            messages.error(request, 'Invalid role selected.')
        else:
            old_role = user.profile.get_role_display()
            user.profile.role = role
            user.profile.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='User',
                object_id=user.username,
                description=f'Changed role of {user.username} from {old_role} to {user.profile.get_role_display()}'
            )
            messages.success(request, f'Role updated for {user.username}.')
    return redirect('users')


@login_required
@admin_or_above
def user_deactivate_view(request, pk):
    user = get_object_or_404(User, pk=pk)
    actor_role = get_user_role(request)
    target_role = getattr(getattr(user, 'profile', None), 'role', None)

    # Prevent self-deactivation
    if user == request.user:
        messages.error(request, 'You cannot deactivate your own account.')
        return redirect('users')

    # Only a super admin may deactivate another super admin
    if target_role == 'super_admin' and actor_role != 'super_admin':
        messages.error(request, 'Only a Super Admin can deactivate another Super Admin.')
        return redirect('users')

    # Never lock out the last active super admin
    if (
        target_role == 'super_admin' and user.is_active
        and User.objects.filter(is_active=True, profile__role='super_admin').count() <= 1
    ):
        messages.error(request, 'Cannot deactivate the last active Super Admin.')
        return redirect('users')

    if request.method == 'POST':
        user.is_active = not user.is_active
        user.save()
        status = 'activated' if user.is_active else 'deactivated'
        AuditLog.objects.create(
            user=request.user, action='update', model_name='User',
            object_id=user.username,
            description=f'{status.title()} user {user.username}'
        )
        messages.success(request, f'User {user.username} {status} successfully!')
        return redirect('users')

    return render(request, 'confirm_delete.html', {
        'object': user,
        'title': f'{"Deactivate" if user.is_active else "Activate"} User',
        'message': f'Are you sure you want to {"deactivate" if user.is_active else "activate"} user "{user.username}"?',
        'cancel_url': 'users',
    })


# ─── AUDIT LOGS ──────────────────────────────────────────────────────────────────

@login_required
@management_or_above
def audit_logs_view(request):
    logs = AuditLog.objects.select_related('user').all()[:100]
    return render(request, 'audit_logs.html', {'logs': logs})


# ─── PROFILE (self-service) ──────────────────────────────────────────────────────

@login_required
def profile_view(request):
    user = request.user
    
    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=user)
        # Build profile form manually
        profile = getattr(user, 'profile', None)
        if profile:
            profile_form = UserProfileForm(request.POST, instance=profile)
        else:
            profile_form = UserProfileForm(request.POST)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile = profile_form.save(commit=False)
            profile.user = user
            profile.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('profile')
    else:
        user_form = UserForm(instance=user)
        profile = getattr(user, 'profile', None)
        profile_form = UserProfileForm(instance=profile) if profile else UserProfileForm()
    
    context = {
        'user_form': user_form,
        'profile_form': profile_form,
    }
    return render(request, 'profile.html', context)


@login_required
def save_theme_view(request):
    """AJAX endpoint to persist theme preference."""
    if request.method == 'POST':
        import json
        try:
            body = json.loads(request.body)
            theme = body.get('theme', 'professional-blue')
        except (json.JSONDecodeError, AttributeError):
            theme = request.POST.get('theme', 'professional-blue')
        
        valid_themes = ['professional-blue', 'modern-green', 'elegant-dark', 'warm-earth', 'minimalist-purple']
        if theme in valid_themes:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.theme = theme
            profile.save()
            return JsonResponse({'status': 'ok', 'theme': theme})
    
    return JsonResponse({'status': 'error'}, status=400)


# ─── DB BACKUP (admin/super_admin only) ──────────────────────────────────────────

@login_required
@admin_or_above
def backup_view(request):
    from pathlib import Path
    from datetime import datetime
    from django.conf import settings

    backup_dir = Path(settings.BASE_DIR) / 'backups'
    last_backups = []
    if backup_dir.exists():
        files = sorted(backup_dir.glob('samana_backup_*.zip'), reverse=True)[:5]
        for f in files:
            last_backups.append({
                'name': f.name,
                'size': f.stat().st_size,
                'time': datetime.fromtimestamp(f.stat().st_mtime),
            })

    restore_form = RestoreBackupForm()
    return render(request, 'backup.html', {
        'last_backups': last_backups,
        'restore_form': restore_form,
    })


@login_required
@admin_or_above
def backup_download_view(request):
    import io
    from pathlib import Path
    from django.conf import settings
    from django.http import FileResponse
    from .backup import build_backup_zip

    data = build_backup_zip()
    filename = f"samana_backup_{timezone.now().strftime('%Y%m%d_%H%M%S')}.zip"

    backup_dir = Path(settings.BASE_DIR) / 'backups'
    backup_dir.mkdir(parents=True, exist_ok=True)
    (backup_dir / filename).write_bytes(data)

    AuditLog.objects.create(
        user=request.user, action='backup', model_name='Database',
        object_id=filename,
        description=f'Database backup downloaded: {filename}'
    )
    messages.success(request, f'Backup created successfully: {filename}')

    response = FileResponse(io.BytesIO(data), as_attachment=True, filename=filename)
    response['Cache-Control'] = 'no-store'
    return response


def _perform_restore(request, data, name):
    from .backup import restore_from_backup
    try:
        summary = restore_from_backup(data)
    except Exception as exc:
        AuditLog.objects.create(
            user=request.user, action='restore', model_name='Database',
            object_id=name, description=f'Restore FAILED: {exc}',
        )
        messages.error(request, f'Restore failed: {exc}')
        return False

    AuditLog.objects.create(
        user=request.user, action='restore', model_name='Database',
        object_id=name,
        description='Database restored: {} rows across {} tables, {} media files'.format(
            summary['total_rows'], len(summary['tables']), summary['media_files']),
    )
    messages.success(
        request,
        'Database restored successfully: {} rows across {} tables, {} media files.'.format(
            summary['total_rows'], len(summary['tables']), summary['media_files']),
    )
    return True


def _restore_blocked(request, name):
    """Basic guard against duplicate restores in quick succession (non-DEBUG)."""
    from django.conf import settings
    if settings.DEBUG:
        return False
    user_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
    return AuditLog.objects.filter(
        user=request.user, action='restore', object_id=name,
        description__icontains=(user_ip or ''),
        created_at__gte=timezone.now() - timedelta(seconds=60),
    ).exists()


@login_required
@admin_or_above
def backup_restore_latest_view(request):
    from pathlib import Path
    from django.conf import settings

    if request.method != 'POST':
        return redirect('backup')

    backup_dir = Path(settings.BASE_DIR) / 'backups'
    if not backup_dir.exists():
        messages.error(request, 'No backups found in the backups folder. Create a backup first.')
        return redirect('backup')

    files = sorted(backup_dir.glob('samana_backup_*.zip'), reverse=True)
    if not files:
        messages.error(request, 'No backups found in the backups folder. Create a backup first.')
        return redirect('backup')

    latest = files[0]
    name = latest.name

    if _restore_blocked(request, name):
        messages.error(request, 'Restore already in progress. Please wait and try again shortly.')
        return redirect('backup')

    with latest.open('rb') as fh:
        data = fh.read()
    _perform_restore(request, data, name)
    return redirect('backup')


@login_required
@admin_or_above
def backup_restore_upload_view(request):
    from django.core.files.uploadedfile import InMemoryUploadedFile

    if request.method != 'POST':
        return redirect('backup')

    form = RestoreBackupForm(request.POST, request.FILES)
    if not form.is_valid():
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(request, error)
        return redirect('backup')

    upload = form.cleaned_data['backup_file']
    if isinstance(upload, InMemoryUploadedFile):
        data = upload.read()
    else:
        data = upload.file.read()

    name = getattr(upload, 'name', 'uploaded_backup.zip')
    if _restore_blocked(request, name):
        messages.error(request, 'Restore already in progress. Please wait and try again shortly.')
        return redirect('backup')

    _perform_restore(request, data, name)
    return redirect('backup')


# ─── CORPORATE SITE + CUSTOMER PORTAL (Django templates) ─────────────────────

def corporate_home_view(request):
    return render(request, 'corporate/home.html', {})


def lead_submit_view(request):
    from .models import Lead
    if request.method != 'POST':
        return redirect('corporate_home')

    name = request.POST.get('name', '').strip()
    email = request.POST.get('email', '').strip()
    phone = request.POST.get('phone', '').strip()
    source = request.POST.get('lead_type', 'hero')
    if source not in dict(Lead.LEAD_SOURCE_CHOICES):
        source = 'hero'

    if not name and not email and not phone:
        messages.error(request, 'Please provide at least your name or email.')
        return redirect('corporate_home')

    Lead.objects.create(name=name, email=email, phone=phone, source=source)
    if request.user.is_authenticated:
        AuditLog.objects.create(
            user=request.user, action='create', model_name='Lead',
            description=f'{source} lead received from website'
        )
    messages.success(request, 'Thank you! Our team will get in touch with you soon.')
    return redirect('corporate_home')


@login_required
def portal_view(request):
    from django.db.models import Sum

    customer = Customer.objects.filter(user=request.user).first()
    if customer is None:
        messages.error(request, 'No customer profile is linked to this account.')
        return redirect('dashboard')

    active_statuses = ['pending', 'confirmed', 'active']
    bookings_qs = customer.bookings.select_related('plot', 'plot__project').all()
    active_bookings = [b for b in bookings_qs if b.status in active_statuses]
    total_amount = sum((b.total_amount for b in active_bookings), 0)
    total_paid = Payment.objects.filter(booking__customer=customer, status='verified').aggregate(
        total=Sum('amount'))['total'] or 0

    payments = (
        Payment.objects.filter(booking__customer=customer)
        .select_related('booking')
        .order_by('-payment_date', '-created_at')
    )

    bookings_payload = []
    installments = []
    for b in bookings_qs:
        plan = getattr(b, 'installment_plan', None)
        plan_installments = list(plan.installments.all().order_by('installment_number')) if plan else []
        installments.extend(plan_installments)
        bookings_payload.append({
            'booking_id': b.booking_id,
            'plot_number': b.plot.plot_number,
            'project': b.plot.project.name if b.plot.project else None,
            'total_amount': float(b.total_amount),
            'advance_paid': float(b.advance_paid),
            'remaining_balance': float(b.remaining_balance),
            'status': b.status,
        })

    installment_payload = [{
        'booking_id': ins.plan.booking.booking_id,
        'installment_number': ins.installment_number,
        'due_date': ins.due_date,
        'amount': float(ins.amount),
        'late_fee': float(ins.late_fee),
        'paid_amount': float(ins.paid_amount),
        'remaining_amount': float(ins.remaining_amount),
        'status': ins.status,
    } for ins in installments]

    pending_installments = [i for i in installment_payload if i['status'] == 'pending']
    overdue_installments = [i for i in installment_payload if i['status'] == 'overdue']
    next_due = min(pending_installments + overdue_installments, key=lambda i: i['due_date']) \
        if (pending_installments or overdue_installments) else None

    payments_payload = [{
        'payment_id': p.payment_id,
        'booking_id': p.booking.booking_id,
        'amount': float(p.amount),
        'payment_date': p.payment_date,
        'payment_method': p.get_payment_method_display(),
        'status': p.status,
    } for p in payments]

    context = {
        'customer': customer,
        'summary': {
            'total_bookings': bookings_qs.count(),
            'total_paid': float(total_paid),
            'remaining_balance': float(total_amount - total_paid),
            'pending_installments': len(pending_installments),
            'overdue_installments': len(overdue_installments),
            'next_due': next_due,
        },
        'bookings': bookings_payload,
        'payments': payments_payload,
        'installments': installment_payload,
    }
    return render(request, 'portal/dashboard.html', context)