from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class Funding(models.Model):
    # Keep the funding source types intentionally narrow.
    SOURCE_TYPES = [
        ('investor', _('Investor')),
        ('donation', _('Donation')),
    ]

    PAYMENT_METHODS = [
        ('transfer', _('Bank Transfer')),
        ('cash', _('Cash')),
        ('qris', 'QRIS/E-Wallet'),
    ]

    # Funding source identity.
    source_name = models.CharField(max_length=255, verbose_name=_("Investor/Donor Name"))
    contact_info = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Contact (Phone/Email)"))
    
    # Funding details.
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='investor', verbose_name=_("Funding Type"))
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name=_("Funding Amount (IDR)"))
    
    # Shares are optional for donations and required for investor funding.
    shares = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Share Units"), help_text=_("Required when source type is Investor"))
    
    date_received = models.DateField(default=timezone.now, verbose_name=_("Received Date"))
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='transfer', verbose_name=_("Payment Method"))
    
    proof_image = models.ImageField(upload_to='funding/proofs/', null=True, blank=True, verbose_name=_("Transfer Proof"))
    notes = models.TextField(null=True, blank=True, verbose_name=_("Notes"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_received']
        verbose_name = _('Funding')
        verbose_name_plural = _('Funding Records')

    def __str__(self):
        return f"{self.source_name} - {self.get_source_type_display()}"
