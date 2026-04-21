# dashboard/models.py
from django.db import models
from django.db.models import Sum
from django.utils.translation import gettext_lazy as _

class SystemConfig(models.Model):
    total_system_shares = models.PositiveIntegerField(default=15000, verbose_name=_("Total Share Units"))
    share_price = models.DecimalField(max_digits=15, decimal_places=2, default=100000, verbose_name=_("Price Per Share"))

    class Meta:
        verbose_name = _("Dashboard & Configuration")
        verbose_name_plural = _("Dashboard & Configuration")

    def __str__(self):
        return "System Settings & Global Report"

    # --- Aggregate helpers ---
    def total_assets(self):
        from asset.models import Asset
        return Asset.objects.count()

    def total_asset_value(self):
        from asset.models import Asset
        return Asset.objects.aggregate(Sum('value'))['value__sum'] or 0

    def total_funding(self):
        from funding.models import Funding
        # Do not filter by status; the field does not exist on the current model
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

        # Do not filter by status; the field does not exist on the current model
        funding_in = Funding.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        sales_in = Sale.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0
        expense_out = Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        dividend_out = ProfitDistributionItem.objects.aggregate(Sum('amount'))['amount__sum'] or 0

        cash_balance = (funding_in + sales_in) - (expense_out + dividend_out)

        return cash_balance

    def shares_sold(self):
        from funding.models import Funding
        # Count only investor funding rows (source_type='investor')
        return Funding.objects.filter(source_type='investor').aggregate(Sum('shares'))['shares__sum'] or 0
    
    def shares_available(self):
        return self.total_system_shares - self.shares_sold()
