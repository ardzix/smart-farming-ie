from django.db import models
from django.utils import timezone
from django.conf import settings
from funding.models import Funding

class ProfitDistribution(models.Model):
    date = models.DateField(default=timezone.now, verbose_name="Tanggal Pembagian")
    total_distributed = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Total Dana Dibagikan")
    notes = models.TextField(blank=True, null=True, verbose_name="Catatan")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name = 'Bagi Hasil'
        verbose_name_plural = 'Riwayat Bagi Hasil'

    def __str__(self):
        return f"Distribusi {self.date} - Rp {self.total_distributed:,.0f}"

class ProfitDistributionItem(models.Model):
    distribution = models.ForeignKey(ProfitDistribution, on_delete=models.CASCADE, related_name='items')
    investor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    funding_source = models.ForeignKey(Funding, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Jumlah Diterima")
    role = models.CharField(max_length=50, default='Investor') 
    
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.role} - {self.amount}"