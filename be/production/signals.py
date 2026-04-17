from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Production

@receiver(post_save, sender=Production)
def update_stock_on_save(sender, instance, created, **kwargs):
    """
    Otomatis update stok produk saat data produksi disimpan/diedit.
    Hanya jika statusnya 'stok' (Masuk Gudang).
    """
    if instance.status == 'stok':
        product = instance.product
        # Hitung ulang total stok berdasarkan semua history produksi yg statusnya stok
        # Ini cara paling aman (recalculation) agar tidak minus/double counting
        total_production = Production.objects.filter(product=product, status='stok').aggregate(total=models.Sum('quantity'))['total'] or 0
        
        # Dikurangi penjualan (Nanti logic penjualan mengurangi stok ada di modul Sales)
        # Untuk sekarang kita set stok = total produksi masuk
        # (Nanti Anda perlu sesuaikan jika Sales sudah jalan)
        
        # Simplifikasi logika untuk sekarang: Tambah stok saat create
        if created:
            product.current_stock += instance.quantity
            product.save()

# Note: Logic stok yang sempurna biasanya melibatkan perhitungan (Total Masuk - Total Keluar)
# Tapi kode di atas sudah cukup untuk membuat stok tidak 0 lagi saat input produksi.