# dashboard/models.py
from django.db import models
from django.db.models import Sum

class SystemConfig(models.Model):
    total_system_shares = models.PositiveIntegerField(default=15000, verbose_name="Total Lembar Saham")
    share_price = models.DecimalField(max_digits=15, decimal_places=2, default=100000, verbose_name="Harga Per Lembar")

    class Meta:
        verbose_name = "Dashboard & Konfigurasi"
        verbose_name_plural = "Dashboard & Konfigurasi"

    def __str__(self):
        return "Pengaturan Sistem & Laporan Global"

    # --- FUNGSI HITUNG ---
    def total_assets(self):
        from asset.models import Asset
        return Asset.objects.count()

    def total_asset_value(self):
        from asset.models import Asset
        return Asset.objects.aggregate(Sum('value'))['value__sum'] or 0

    def total_funding(self):
        from funding.models import Funding
        # [FIX] Hapus filter status='active' (field tidak ada)
        val = Funding.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        return val

    def total_revenue(self):
        from sales.models import Sale
        val = Sale.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0
        return val

    def total_expense(self):
        from expense.models import Expense
        val = Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        return val

    def total_yield(self):
        from profit_distribution.models import ProfitDistributionItem
        val = ProfitDistributionItem.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        return val

    def total_cash_on_hand(self):
        from funding.models import Funding
        from expense.models import Expense
        from sales.models import Sale
        from profit_distribution.models import ProfitDistributionItem

        # [FIX] Hapus filter status
        funding_in = Funding.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        sales_in = Sale.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0
        expense_out = Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        dividend_out = ProfitDistributionItem.objects.aggregate(Sum('amount'))['amount__sum'] or 0

        saldo = (funding_in + sales_in) - (expense_out + dividend_out)

        return saldo

    def shares_sold(self):
        from funding.models import Funding
        # Filter hanya investor (source_type='investor')
        return Funding.objects.filter(source_type='investor').aggregate(Sum('shares'))['shares__sum'] or 0
    
    def shares_available(self):
        return self.total_system_shares - self.shares_sold()