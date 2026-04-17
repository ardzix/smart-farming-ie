from django.contrib import admin
from .models import ProfitDistribution, ProfitDistributionItem

# Menampilkan rincian item (siapa dapat berapa) di dalam halaman detail Distribusi
class ProfitDistributionItemInline(admin.TabularInline):
    model = ProfitDistributionItem
    extra = 0 # Tidak menampilkan baris kosong tambahan
    
    # Field ini hanya bisa dibaca agar history tidak diubah sembarangan
    readonly_fields = ('investor', 'funding_source', 'amount', 'role', 'description')
    
    # Agar lebih rapi, kita matikan fitur tambah/hapus manual di sini (opsional)
    can_delete = False 
    
    def has_add_permission(self, request, obj=None):
        return False

@admin.register(ProfitDistribution)
class ProfitDistributionAdmin(admin.ModelAdmin):
    # Field yang muncul di tabel utama (List View)
    list_display = (
        'id',
        'date', 
        'total_distributed', 
        'created_at'
    )
    
    # Filter dan Pencarian
    list_filter = ('date',)
    search_fields = ('notes',)
    
    # Menampilkan Inline Items di bawah form detail
    inlines = [ProfitDistributionItemInline]
    
    # Field header yang bisa dibaca/edit
    fields = ('date', 'total_distributed', 'notes', 'created_at')
    readonly_fields = ('created_at',)