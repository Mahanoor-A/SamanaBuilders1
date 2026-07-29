# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_payment_payment_type_paymentattachment'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='method_data',
            field=models.JSONField(blank=True, default=dict, help_text='Method-specific payment details'),
        ),
    ]
