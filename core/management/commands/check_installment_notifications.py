"""
Management command: check_installment_notifications

Run daily (ideally via cron/scheduler) to:
1. Mark overdue installments
2. Send overdue payment alerts
3. Send upcoming installment reminders (7 days before due)

Usage:
    python manage.py check_installment_notifications

For testing with dry-run:
    python manage.py check_installment_notifications --dry-run
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check installments and send overdue/reminder notifications automatically'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually sending notifications',
        )
        parser.add_argument(
            '--reminder-days',
            type=int,
            default=7,
            help='Days before due date to send reminders (default: 7)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        reminder_days = options['reminder_days']
        today = date.today()

        self.stdout.write(self.style.NOTICE(f'Running installment notification check for {today}...'))

        # ── STEP 1: Mark overdue installments ──────────────────────────────
        from bookings.models import Installment

        overdue_installments = Installment.objects.filter(
            status='pending',
            due_date__lt=today,
        ).select_related('plan', 'plan__booking', 'plan__booking__customer', 'plan__booking__plot', 'plan__booking__plot__project')

        marked_count = 0
        for inst in overdue_installments:
            if dry_run:
                self.stdout.write(f'  [DRY RUN] Would mark overdue: Installment #{inst.installment_number} ({inst.plan.booking.booking_id})')
            else:
                inst.status = 'overdue'
                # Apply late fee if configured
                plan = inst.plan
                if plan.late_fee_per_day > 0:
                    days_overdue = (today - inst.due_date).days
                    inst.late_fee = min(
                        plan.late_fee_per_day * days_overdue,
                        # Cap at max if configured
                        getattr(inst.plan, 'late_fee_config', None) and inst.plan.late_fee_config.max_late_fee_per_installment or inst.late_fee_per_day * days_overdue,
                    )
                inst.save()
            marked_count += 1

        self.stdout.write(self.style.WARNING(f'Found {overdue_installments.count()} overdue installments to mark'))

        # ── STEP 2: Send overdue payment alerts ────────────────────────────
        overdue_to_notify = Installment.objects.filter(
            status='overdue',
            paid_amount=0,
        ).select_related('plan', 'plan__booking', 'plan__booking__customer', 'plan__booking__plot', 'plan__booking__plot__project')

        sent_overdue = 0
        for inst in overdue_to_notify:
            customer = inst.plan.booking.customer
            if not customer.email and not customer.phone:
                continue

            if dry_run:
                self.stdout.write(f'  [DRY RUN] Would send overdue alert: Installment #{inst.installment_number} to {customer.full_name}')
            else:
                try:
                    from notifications.services import NotificationService
                    NotificationService.send_overdue_payment_alert(inst)
                    sent_overdue += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Failed to send overdue alert for {customer.full_name}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Sent {sent_overdue} overdue payment alerts'))

        # ── STEP 3: Send upcoming installment reminders ─────────────────────
        reminder_start = today
        reminder_end = today + timedelta(days=reminder_days)

        upcoming_installments = Installment.objects.filter(
            status='pending',
            due_date__gte=reminder_start,
            due_date__lte=reminder_end,
        ).select_related('plan', 'plan__booking', 'plan__booking__customer', 'plan__booking__plot', 'plan__booking__plot__project')

        # Don't double-send: check if we already sent a reminder today
        from notifications.models import NotificationLog
        already_notified = set()
        today_reminders = NotificationLog.objects.filter(
            notification_type='installment_reminder',
            created_at__date=today,
        ).values_list('related_booking_id', flat=True)

        sent_reminders = 0
        for inst in upcoming_installments:
            booking_id = inst.plan.booking.booking_id
            if booking_id in already_notified or booking_id in today_reminders:
                continue

            customer = inst.plan.booking.customer
            if not customer.email and not customer.phone:
                continue

            if dry_run:
                self.stdout.write(f'  [DRY RUN] Would send reminder: Installment #{inst.installment_number} due {inst.due_date} to {customer.full_name}')
            else:
                try:
                    from notifications.services import NotificationService
                    NotificationService.send_installment_reminder(inst)
                    already_notified.add(booking_id)
                    sent_reminders += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Failed to send reminder for {customer.full_name}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Sent {sent_reminders} upcoming installment reminders'))

        # ── SUMMARY ─────────────────────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'INSTALLMENT NOTIFICATION CHECK COMPLETE'))
        self.stdout.write(self.style.SUCCESS(f'  Overdue installments marked: {marked_count}'))
        self.stdout.write(self.style.SUCCESS(f'  Overdue alerts sent: {sent_overdue}'))
        self.stdout.write(self.style.SUCCESS(f'  Upcoming reminders sent: {sent_reminders}'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
