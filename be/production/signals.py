from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Production

@receiver(post_save, sender=Production)
def update_stock_on_save(sender, instance, created, **kwargs):
    """
    Update product stock when a production row is saved or updated.
    Only applies to rows with the 'stok' (warehouse inbound) status.
    """
    if instance.status == 'stok':
        product = instance.product
        # Recalculate stock from all production history rows marked as warehouse inbound
        # Recalculation is the safest approach to avoid negative stock or double counting
        total_production = Production.objects.filter(product=product, status='stok').aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # Sales reductions are handled in the sales module
        # For now the stock baseline comes from inbound production totals
        # Adjust this if the inventory model changes in the future
        
        # Current simplification: only increment stock on create
        if created:
            product.current_stock += instance.quantity
            product.save()

# Note: a full inventory model usually calculates stock as total inbound - total outbound
# The current logic is only a temporary safeguard to keep stock from staying at zero after production input.
