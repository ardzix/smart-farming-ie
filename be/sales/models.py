from django.db import models
from django.utils import timezone
from production.models import Product  # Import dari sebelah

class Sale(models.Model):
    # [UBAH] Pakai ForeignKey agar jadi DROPDOWN & Mengurangi Stok
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="Pilih Produk (Stok Tersedia)")
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Jumlah Terjual")
    price_per_unit = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Harga Satuan (Rp)")
    total_price = models.DecimalField(max_digits=15, decimal_places=2, editable=False, verbose_name="Total Penjualan")
    
    buyer_name = models.CharField(max_length=255, default="Umum", verbose_name="Nama Pembeli")
    date = models.DateField(default=timezone.now, verbose_name="Tanggal Transaksi")
    proof_image = models.ImageField(upload_to='sales/', null=True, blank=True, verbose_name="Bukti")

    def save(self, *args, **kwargs):
        # 1. Validasi Stok (Opsional: Cegah jual kalau stok kurang)
        if self.pk is None and self.quantity > self.product.current_stock:
            raise ValueError(f"Stok tidak cukup! Sisa: {self.product.current_stock}")

        # 2. Hitung Harga
        self.total_price = self.quantity * self.price_per_unit
        
        # 3. Kurangi Stok Global
        if self.pk is None:
            self.product.current_stock -= self.quantity
            self.product.save()
            
        super().save(*args, **kwargs)