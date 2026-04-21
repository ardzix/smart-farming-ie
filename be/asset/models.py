from django.db import models
from django.utils.translation import gettext_lazy as _

class Asset(models.Model):
    # --- Choice sets retained for compatibility ---
    ASSET_TYPES = [
        ('lahan', _('Land')),
        ('alat', _('Equipment')),
        ('bangunan', _('Building')),
        ('ternak', _('Livestock')),
    ]

    OWNERSHIP_STATUS_CHOICES = [
        ('full_ownership', _('Full Ownership')),
        ('partial_ownership', _('Partial Ownership')),
        ('investor_owned', _('Investor Owned')),
        ('leashold', _('Leased')),
        ('under_construction', _('Under Construction')),
        ('personal_ownership', _('Personal Ownership')),
    ]

    # --- Fields ---
    name = models.CharField(max_length=100, verbose_name=_('Asset Name'))
    
    # Asset type
    type = models.CharField(max_length=100, choices=ASSET_TYPES, verbose_name=_('Asset Type'))
    
    location = models.CharField(max_length=100, verbose_name=_('Location'))
    size = models.FloatField(verbose_name=_('Size (m2)'), null=True, blank=True)
    
    value = models.DecimalField(max_digits=20, decimal_places=2, verbose_name=_('Asset Value'))
    acquisition_date = models.DateField(verbose_name=_('Acquisition Date'))
    
    # Ownership status
    ownership_status = models.CharField(
        max_length=50, 
        choices=OWNERSHIP_STATUS_CHOICES,
        verbose_name=_('Ownership Status')
    )
    
    # Landowner data remains plain text; there is no separate table
    landowner = models.CharField(max_length=100, null=True, blank=True, verbose_name=_('Landowner Name'))
    
    # Landowner revenue-share percentage
    landowner_share_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name=_('Landowner Share %')
    )

    # Store uploaded asset images/documents directly on the model
    image = models.ImageField(upload_to='assets/', null=True, blank=True, verbose_name=_('Photo/Document'))

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('Asset')
        verbose_name_plural = _('Assets')
