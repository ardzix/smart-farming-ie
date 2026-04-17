from django.contrib import admin
from .models import Sale

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    # [UBAH] Ganti 'product_name' jadi 'product'
    list_display = ('product', 'quantity', 'total_price', 'buyer_name', 'date')
    list_filter = ('date',)
    search_fields = ('product__name', 'buyer_name')