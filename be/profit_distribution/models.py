from django.db import models
from django.utils import timezone
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from funding.models import Funding

class ProfitDistribution(models.Model):
    date = models.DateField(default=timezone.now, verbose_name=_("Distribution Date"))
    total_distributed = models.DecimalField(max_digits=15, decimal_places=2, verbose_name=_("Total Distributed Amount"))
    notes = models.TextField(blank=True, null=True, verbose_name=_("Notes"))
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('Profit Distribution')
        verbose_name_plural = _('Profit Distribution History')

    def __str__(self):
        return f"Distribusi {self.date} - Rp {self.total_distributed:,.0f}"

class ProfitDistributionItem(models.Model):
    distribution = models.ForeignKey(ProfitDistribution, on_delete=models.CASCADE, related_name='items')
    investor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    funding_source = models.ForeignKey(Funding, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name=_("Received Amount"))
    role = models.CharField(max_length=50, default='Investor') 
    
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.role} - {self.amount}"
