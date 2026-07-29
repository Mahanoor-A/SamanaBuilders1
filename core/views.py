from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import UserProfile, AuditLog
from .forms import UserForm, UserProfileForm, CreateUserForm, UserEditForm
from .permissions import role_required, super_admin_required, admin_or_above, staff_or_above
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
    
    # Revenue stats
    total_revenue = Payment.objects.filter(status='verified').aggregate(total=Sum('amount'))['total'] or 0
    monthly_revenue = Payment.objects.filter(
        status='verified', payment_date__gte=month_ago
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Booking stats
    pending_bookings = Booking.objects.filter(status='pending').count()
    active_bookings = Booking.objects.filter(status__in=['confirmed', 'active']).count()
    
    # Payment stats
    pending_payments = Payment.objects.filter(status='pending').count()
    verified_payments = Payment.objects.filter(status='verified').count()
    
    # Property stats
    available_plots = Plot.objects.filter(status='available').count()
    booked_plots = Plot.objects.filter(status='booked').count()
    sold_plots = Plot.objects.filter(status='sold').count()
    
    # Installment stats
    overdue_installments = Installment.objects.filter(status='overdue').count()
    paid_installments = Installment.objects.filter(status='paid').count()
    
    # Staff vs admin dashboard
    user_role = None
    if hasattr(request.user, 'profile'):
        user_role = request.user.profile.role
    
    context = {
        # Customers
        'total_customers': Customer.objects.count(),
        'active_customers': Customer.objects.filter(is_active=True).count(),
        
        # Projects / Properties
        'total_projects': Project.objects.filter(is_active=True).count(),
        'total_plots': Plot.objects.count(),
        'available_plots': available_plots,
        'booked_plots': booked_plots,
        'sold_plots': sold_plots,
        
        # Bookings
        'total_bookings': Booking.objects.count(),
        'pending_bookings': pending_bookings,
        'active_bookings': active_bookings,
        'confirmed_bookings': Booking.objects.filter(status='confirmed').count(),
        'cancelled_bookings': Booking.objects.filter(status='cancelled').count(),
        
        # Payments
        'total_payments': Payment.objects.count(),
        'pending_payments': pending_payments,
        'verified_payments': verified_payments,
        'total_revenue': total_revenue,
        'monthly_revenue': monthly_revenue,
        
        # Installments
        'overdue_installments': overdue_installments,
        'paid_installments': paid_installments,
        
        # Recent records
        'recent_bookings': Booking.objects.select_related('customer', 'plot').order_by('-created_at')[:5],
        'recent_payments': Payment.objects.select_related('booking', 'booking__customer').order_by('-created_at')[:5],
        
        # User role for template
        'user_role': user_role,
    }
    return render(request, 'dashboard.html', context)


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
@admin_or_above
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
    context = {
        'customer': customer,
        'bookings': bookings,
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
@admin_or_above
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
@admin_or_above
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
@admin_or_above
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
@admin_or_above
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
def payments_view(request):
    payments = Payment.objects.select_related('booking', 'booking__customer').all()
    status_filter = request.GET.get('status', '')
    method_filter = request.GET.get('method', '')
    search = request.GET.get('search', '')
    
    if status_filter:
        payments = payments.filter(status=status_filter)
    if method_filter:
        payments = payments.filter(payment_method=method_filter)
    if search:
        payments = payments.filter(
            Q(payment_id__icontains=search) |
            Q(booking__booking_id__icontains=search) |
            Q(booking__customer__full_name__icontains=search)
        )
    
    payments = payments.select_related('booking', 'booking__customer', 'booking__plot', 'verified_by')
    
    verified_count = payments.filter(status='verified').count()
    pending_count = payments.filter(status='pending').count()
    rejected_count = payments.filter(status='rejected').count()
    
    context = {
        'payments': payments,
        'status_filter': status_filter,
        'method_filter': method_filter,
        'search': search,
        'verified_count': verified_count,
        'pending_count': pending_count,
        'rejected_count': rejected_count,
    }
    return render(request, 'payments.html', context)


@login_required
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
            payment.save()
            
            # Auto-generate receipt
            receipt = Receipt.objects.create(
                payment=payment,
                receipt_date=payment.payment_date,
                generated_by=request.user,
            )
            payment.receipt_generated = True
            payment.save(update_fields=['receipt_generated'])
            
            # Handle file attachments
            files = request.FILES.getlist('attachments')
            for f in files:
                PaymentAttachment.objects.create(
                    payment=payment,
                    file=f,
                    attachment_type='other',
                    filename=f.name,
                    uploaded_by=request.user,
                )
            
            AuditLog.objects.create(
                user=request.user, action='create', model_name='Payment',
                object_id=payment.payment_id,
                description=f'Created payment {payment.payment_id} for booking {payment.booking.booking_id}'
            )
            messages.success(request, f'Payment {payment.payment_id} created successfully! Receipt {receipt.receipt_number} generated.')
            return redirect('payments')
    else:
        form = PaymentForm()
        if pre_filled_booking:
            form.fields['booking'].initial = pre_filled_booking.id
            form.fields['booking'].widget.attrs['disabled'] = True
    
    projects = Project.objects.filter(is_active=True)
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
@admin_or_above  # Only admin/super_admin can verify payments
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
                if booking.remaining_balance <= 0:
                    booking.status = 'completed'
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
    
    return render(request, 'payment_detail.html', {
        'payment': payment,
        'installments': installments,
        'payment_summary': payment_summary,
        'attachments': all_attachments,
    })


@login_required
@admin_or_above  # Only admin/super_admin can delete payments
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


# ─── RECEIPTS ─────────────────────────────────────────────────────────────────────

@login_required
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


# ─── USERS (admin/super_admin only) ──────────────────────────────────────────────

@login_required
@admin_or_above
def users_view(request):
    users = User.objects.select_related('profile').all()
    return render(request, 'users.html', {'users': users})


@login_required
@admin_or_above
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
    
    if request.method == 'POST':
        form = UserEditForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            AuditLog.objects.create(
                user=request.user, action='update', model_name='User',
                object_id=user.username,
                description=f'Updated user {user.username}'
            )
            messages.success(request, f'User {user.username} updated successfully!')
            return redirect('users')
    else:
        form = UserEditForm(instance=user)
    
    return render(request, 'user_form.html', {'form': form, 'title': f'Edit User: {user.username}', 'user': user})


@login_required
@admin_or_above
def user_deactivate_view(request, pk):
    user = get_object_or_404(User, pk=pk)
    
    # Prevent self-deactivation
    if user == request.user:
        messages.error(request, 'You cannot deactivate your own account.')
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
@admin_or_above
def audit_logs_view(request):
    logs = AuditLog.objects.select_related('user').all()[:100]
    return render(request, 'audit_logs.html', {'logs': logs})


# ─── PROFILE (self-service) ──────────────────────────────────────────────────────

@login_required
def profile_view(request):
    user = request.user
    
    if request.method == 'POST':
        user_form = UserForm(request.POST, instance=user, data={'is_active': user.is_active})
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