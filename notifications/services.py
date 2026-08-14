import logging
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import NotificationLog

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send(to_email, subject, message, from_email=None):
        if not to_email:
            return False, "No email address provided"
        try:
            from_email = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@samanabuilders.com')
            send_mail(subject, message, from_email, [to_email], fail_silently=False)
            return True, "Email sent successfully"
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False, str(e)


class SMSService:
    @staticmethod
    def send(to_phone, message):
        if not to_phone:
            return False, "No phone number provided"
        # SMS integration placeholder - configure with Twilio, WAVII, etc.
        # For now, log the SMS
        logger.info(f"SMS to {to_phone}: {message}")
        return True, "SMS queued (integration pending)"


class WhatsAppService:
    @staticmethod
    def send(to_phone, message):
        if not to_phone:
            return False, "No phone number provided"
        # WhatsApp Business API integration
        # Uses the WhatsApp URL scheme for simple messaging
        try:
            # Clean phone number
            phone = to_phone.replace('+', '').replace('-', '').replace(' ', '')
            if phone.startswith('0'):
                phone = '92' + phone[1:]
            # Generate WhatsApp click-to-chat URL
            wa_url = f"https://wa.me/{phone}?text={requests.utils.quote(message)}"
            logger.info(f"WhatsApp message prepared for {phone}: {wa_url}")
            return True, wa_url
        except Exception as e:
            logger.error(f"WhatsApp prepare failed: {e}")
            return False, str(e)

    @staticmethod
    def get_click_to_chat_url(phone, message=''):
        phone = (phone or '').replace('+', '').replace('-', '').replace(' ', '')
        if phone.startswith('0'):
            phone = '92' + phone[1:]
        return f"https://wa.me/{phone}?text={requests.utils.quote(message)}" if phone else ''


class NotificationService:
    @staticmethod
    def send_notification(recipient_name, recipient_contact, channel, notification_type,
                         message, subject='', customer_id='', booking_id='', user=None):
        log = NotificationLog.objects.create(
            recipient_name=recipient_name,
            recipient_contact=recipient_contact,
            channel=channel,
            notification_type=notification_type,
            subject=subject,
            message=message,
            related_customer_id=customer_id,
            related_booking_id=booking_id,
            created_by=user,
        )

        success = False
        detail = ''

        if channel == 'email':
            success, detail = EmailService.send(recipient_contact, subject, message)
        elif channel == 'sms':
            success, detail = SMSService.send(recipient_contact, message)
        elif channel == 'whatsapp':
            success, detail = WhatsAppService.send(recipient_contact, message)

        log.status = 'sent' if success else 'failed'
        log.error_message = '' if success else detail
        log.sent_at = timezone.now() if success else None
        log.save()

        return log

    @staticmethod
    def send_payment_confirmation(payment):
        booking = payment.booking
        customer = booking.customer
        message = (
            f"Dear {customer.full_name},\n\n"
            f"Your payment of Rs. {payment.amount:,.0f} has been received successfully.\n\n"
            f"Payment ID: {payment.payment_id}\n"
            f"Booking: {booking.booking_id}\n"
            f"Date: {payment.payment_date}\n"
            f"Method: {payment.get_payment_method_display()}\n\n"
            f"Thank you for your payment!\n"
            f"Samana Builders & Developers"
        )
        channels = ['email']
        if customer.phone:
            channels.append('whatsapp')

        for ch in channels:
            contact = customer.email if ch == 'email' else customer.phone
            if contact:
                NotificationService.send_notification(
                    recipient_name=customer.full_name,
                    recipient_contact=contact,
                    channel=ch,
                    notification_type='payment_confirmation',
                    subject=f'Payment Confirmation - {payment.payment_id}',
                    message=message,
                    customer_id=customer.customer_id,
                    booking_id=booking.booking_id,
                )

    @staticmethod
    def send_booking_notification(booking):
        customer = booking.customer
        message = (
            f"Dear {customer.full_name},\n\n"
            f"Your booking {booking.booking_id} has been created successfully.\n\n"
            f"Plot: {booking.plot.plot_number}\n"
            f"Project: {booking.plot.project.name}\n"
            f"Total Amount: Rs. {booking.total_amount:,.0f}\n"
            f"Status: {booking.get_status_display()}\n\n"
            f"Samana Builders & Developers"
        )
        channels = ['email']
        if customer.phone:
            channels.append('whatsapp')

        for ch in channels:
            contact = customer.email if ch == 'email' else customer.phone
            if contact:
                NotificationService.send_notification(
                    recipient_name=customer.full_name,
                    recipient_contact=contact,
                    channel=ch,
                    notification_type='booking_notification',
                    subject=f'Booking Confirmation - {booking.booking_id}',
                    message=message,
                    customer_id=customer.customer_id,
                    booking_id=booking.booking_id,
                )

    @staticmethod
    def send_installment_reminder(installment):
        booking = installment.plan.booking
        customer = booking.customer
        message = (
            f"Dear {customer.full_name},\n\n"
            f"This is a friendly reminder that Installment #{installment.installment_number} "
            f"of Rs. {installment.amount:,.0f} is due on {installment.due_date}.\n\n"
            f"Booking: {booking.booking_id}\n"
            f"Plot: {booking.plot.plot_number}\n"
            f"Project: {booking.plot.project.name}\n\n"
            f"Please ensure timely payment to avoid late fees.\n\n"
            f"Samana Builders & Developers"
        )
        channels = ['email']
        if customer.phone:
            channels.append('whatsapp')

        for ch in channels:
            contact = customer.email if ch == 'email' else customer.phone
            if contact:
                NotificationService.send_notification(
                    recipient_name=customer.full_name,
                    recipient_contact=contact,
                    channel=ch,
                    notification_type='installment_reminder',
                    subject=f'Installment Reminder - Installment #{installment.installment_number}',
                    message=message,
                    customer_id=customer.customer_id,
                    booking_id=booking.booking_id,
                )

    @staticmethod
    def send_overdue_payment_alert(installment):
        booking = installment.plan.booking
        customer = booking.customer
        message = (
            f"Dear {customer.full_name},\n\n"
            f"Your Installment #{installment.installment_number} of Rs. {installment.amount:,.0f} "
            f"was due on {installment.due_date} and is now OVERDUE.\n\n"
            f"Late Fee Applied: Rs. {installment.late_fee:,.0f}\n"
            f"Total Outstanding: Rs. {installment.remaining_amount:,.0f}\n\n"
            f"Please arrange immediate payment to avoid additional charges.\n\n"
            f"Samana Builders & Developers"
        )
        channels = ['email']
        if customer.phone:
            channels.extend(['sms', 'whatsapp'])

        for ch in channels:
            contact = customer.email if ch == 'email' else customer.phone
            if contact:
                NotificationService.send_notification(
                    recipient_name=customer.full_name,
                    recipient_contact=contact,
                    channel=ch,
                    notification_type='overdue_payment',
                    subject=f'OVERDUE: Installment #{installment.installment_number}',
                    message=message,
                    customer_id=customer.customer_id,
                    booking_id=booking.booking_id,
                )

    @staticmethod
    def send_receipt_notification(receipt):
        payment = receipt.payment
        booking = payment.booking
        customer = booking.customer
        message = (
            f"Dear {customer.full_name},\n\n"
            f"Your receipt {receipt.receipt_number} has been generated.\n\n"
            f"Amount: Rs. {payment.amount:,.0f}\n"
            f"Date: {receipt.receipt_date}\n"
            f"Payment ID: {payment.payment_id}\n\n"
            f"Thank you for your payment!\n\n"
            f"Samana Builders & Developers"
        )
        channels = ['email']
        if customer.phone:
            channels.append('whatsapp')

        for ch in channels:
            contact = customer.email if ch == 'email' else customer.phone
            if contact:
                NotificationService.send_notification(
                    recipient_name=customer.full_name,
                    recipient_contact=contact,
                    channel=ch,
                    notification_type='receipt_notification',
                    subject=f'Receipt Generated - {receipt.receipt_number}',
                    message=message,
                    customer_id=customer.customer_id,
                    booking_id=booking.booking_id,
                )
