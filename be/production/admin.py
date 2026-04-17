from django.contrib import admin
from .models import Production, Product, StockAdjustment

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit', 'current_stock', 'updated_at')
    search_fields = ('name',)

@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ('product', 'asset', 'date', 'quantity', 'status')
    list_filter = ('status', 'date', 'asset')
    search_fields = ('product__name', 'asset__name')


# ==========================================
# ADMIN STOCK ADJUSTMENT (BARU)
# ==========================================
@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'adjustment_type', 'quantity', 'reason', 'date', 'created_by', 'created_at')
    list_filter = ('adjustment_type', 'reason', 'date')
    search_fields = ('product__name', 'notes')
    readonly_fields = ('created_at', 'created_by')
    
    fieldsets = (
        ('Informasi Produk', {
            'fields': ('product', 'adjustment_type', 'quantity')
        }),
        ('Detail Penyesuaian', {
            'fields': ('reason', 'notes', 'date', 'proof_image')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Saat create baru
            obj.created_by = request.user
        super().save_model(request, obj, form, change)