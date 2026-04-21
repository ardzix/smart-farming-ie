from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from production.models import Product  # Import dari sebelah

class Sale(models.Model):
    # Use a ForeignKey so the frontend gets a dropdown and inventory can be adjusted directly
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name=_("Select Product (Available Stock)"))
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Quantity Sold"))
    price_per_unit = models.DecimalField(max_digits=15, decimal_places=2, verbose_name=_("Unit Price (IDR)"))
    total_price = models.DecimalField(max_digits=15, decimal_places=2, editable=False, verbose_name=_("Total Sales Amount"))
    
    buyer_name = models.CharField(max_length=255, default=_("General"), verbose_name=_("Buyer Name"))
    date = models.DateField(default=timezone.now, verbose_name=_("Transaction Date"))
    proof_image = models.ImageField(upload_to='sales/', null=True, blank=True, verbose_name=_("Proof"))

    def save(self, *args, **kwargs):
        # 1. Validate stock before creating a new sale
        if self.pk is None and self.quantity > self.product.current_stock:
            raise ValueError(_("Insufficient stock. Remaining: %(stock)s") % {'stock': self.product.current_stock})

        # 2. Calculate the total price
        self.total_price = self.quantity * self.price_per_unit
        
        # 3. Reduce the shared inventory balance
        if self.pk is None:
            self.product.current_stock -= self.quantity
            self.product.save()
            
        super().save(*args, **kwargs)
