from django.db import models
from asset.models import Asset 
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Product(models.Model):
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50) 
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Production(models.Model):
    STATUS_CHOICES = (
        ('stok', _('Inbound Stock')),
        ('terjual', _('Sold Immediately')),
    )

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='productions')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='production_history')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, blank=True, null=True)
    
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='stok')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} - {self.date}"


# ==========================================
# MODEL BARU: STOCK ADJUSTMENT
# ==========================================
class StockAdjustment(models.Model):
    ADJUSTMENT_TYPES = (
        ('addition', _('Stock Increase')),
        ('reduction', _('Stock Reduction')),
    )
    
    REASON_CHOICES = (
        ('damaged', _('Damaged Goods')),
        ('expired', _('Expired')),
        ('pest', _('Pest Damage')),
        ('theft', _('Loss/Theft')),
        ('recount', _('Recount Correction')),
        ('found', _('Recovered Stock')),
        ('other', _('Other')),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='adjustments')
    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_TYPES, verbose_name=_("Adjustment Type"))
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Adjustment Quantity"))
    
    reason = models.CharField(max_length=50, choices=REASON_CHOICES, verbose_name=_("Reason"))
    notes = models.TextField(blank=True, null=True, verbose_name=_("Additional Notes"))
    
    date = models.DateField(verbose_name=_("Adjustment Date"))
    proof_image = models.ImageField(upload_to='stock_adjustments/', null=True, blank=True, verbose_name=_("Photo Proof"))
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_adjustments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = _('Stock Adjustment')
        verbose_name_plural = _('Stock Adjustment History')

    def save(self, *args, **kwargs):
        # Auto-adjust stok produk saat create (bukan edit)
        if self.pk is None:  # Hanya saat create
            if self.adjustment_type == 'addition':
                self.product.current_stock += self.quantity
            else:  # reduction
                self.product.current_stock -= self.quantity
                
            self.product.save()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_adjustment_type_display()} - {self.product.name} ({self.quantity})"
