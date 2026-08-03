import csv
import io
import zipfile
from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.db import models
from django.utils import timezone


def _serialize(value):
    if value is None:
        return ''
    if isinstance(value, bool):
        return '1' if value else '0'
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    if isinstance(value, models.Model):
        return str(value.pk)
    return str(value)


def table_to_csv(model):
    """Serialize all rows of a model to CSV (one file per DB table)."""
    fields = [f for f in model._meta.concrete_fields]
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow([f.name for f in fields])
    for obj in model.objects.all():
        writer.writerow([_serialize(getattr(obj, f.name)) for f in fields])
    return out.getvalue()


def customers_media_csv():
    """CSV listing media filenames saved against each customer."""
    from customers.models import Customer
    from payments.models import PaymentAttachment, Receipt

    attachment_files = {}
    for pa in PaymentAttachment.objects.select_related('payment__booking__customer').all():
        customer_id = pa.payment.booking.customer_id
        attachment_files.setdefault(customer_id, []).append(pa.file.name)

    receipt_files = {}
    for r in Receipt.objects.select_related('payment__booking__customer').all():
        if r.pdf_file:
            customer_id = r.payment.booking.customer_id
            receipt_files.setdefault(customer_id, []).append(r.pdf_file.name)

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow([
        'customer_id', 'full_name', 'email', 'phone',
        'customer_document', 'customer_image',
        'payment_attachments', 'receipt_pdfs', 'all_media_files',
    ])
    for c in Customer.objects.all():
        docs = []
        if c.document:
            docs.append(c.document.name)
        if c.image:
            docs.append(c.image.name)
        atts = attachment_files.get(c.id, [])
        pdfs = receipt_files.get(c.id, [])
        all_media = docs + atts + pdfs
        writer.writerow([
            c.customer_id, c.full_name, c.email or '', c.phone,
            '; '.join(docs), '; '.join(atts), '; '.join(pdfs), '; '.join(all_media),
        ])
    return out.getvalue()


def media_manifest_rows():
    """Rows linking every stored file to its owning record (model, id, field, file)."""
    rows = [['model', 'object_id', 'field', 'file']]
    for model in apps.get_models():
        for f in model._meta.concrete_fields:
            if isinstance(f, models.FileField):
                for obj in model.objects.all():
                    value = getattr(obj, f.name)
                    if value:
                        rows.append([model._meta.db_table, obj.pk, f.name, value.name])
    return rows


def build_backup_zip():
    """Full DB dump (CSV per table) + media folder + media manifest as a ZIP."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for model in apps.get_models():
            zf.writestr(f'database/{model._meta.db_table}.csv', table_to_csv(model))

        # Media filenames saved against each customer
        zf.writestr('database/customers_media.csv', customers_media_csv())

        # Manifest mapping every media file to its record
        manifest_out = io.StringIO()
        manifest_writer = csv.writer(manifest_out)
        manifest_writer.writerows(media_manifest_rows())
        zf.writestr('media/manifest.csv', manifest_out.getvalue())

        # Full media folder
        media_root = Path(settings.MEDIA_ROOT)
        if media_root.exists():
            for path in sorted(media_root.rglob('*')):
                if path.is_file():
                    zf.write(str(path), f'media/{path.relative_to(media_root).as_posix()}')

        zf.writestr(
            'backup_info.txt',
            'Samana Builders - Real Estate ERP Backup\n'
            f'Generated: {timezone.now().isoformat()}\n'
            f"Database Engine: {settings.DATABASES['default']['ENGINE']}\n"
            f"Media Root: {settings.MEDIA_ROOT}\n",
        )
    return buf.getvalue()
