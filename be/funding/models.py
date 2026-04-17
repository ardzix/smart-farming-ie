from django.db import models
from django.utils import timezone

class Funding(models.Model):
    # [UBAH] Hanya 2 Pilihan sesuai request
    SOURCE_TYPES = [
        ('investor', 'Investor'),
        ('donation', 'Donasi'),
    ]

    PAYMENT_METHODS = [
        ('transfer', 'Transfer Bank'),
        ('cash', 'Tunai'),
        ('qris', 'QRIS/E-Wallet'),
    ]

    # Identitas Pemberi Dana
    source_name = models.CharField(max_length=255, verbose_name="Nama Investor/Donatur")
    contact_info = models.CharField(max_length=100, null=True, blank=True, verbose_name="Kontak (HP/Email)")
    
    # Detail Dana
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='investor', verbose_name="Tipe Dana")
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="Jumlah Dana (Rp)")
    
    # [PENTING] null=True, blank=True artinya "Boleh Kosong" (untuk Donasi)
    shares = models.PositiveIntegerField(null=True, blank=True, verbose_name="Lembar Saham", help_text="Wajib diisi jika Investor")
    
    date_received = models.DateField(default=timezone.now, verbose_name="Tanggal Diterima")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='transfer', verbose_name="Metode Pembayaran")
    
    proof_image = models.ImageField(upload_to='funding/proofs/', null=True, blank=True, verbose_name="Bukti Transfer")
    notes = models.TextField(null=True, blank=True, verbose_name="Catatan")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_received']
        verbose_name = 'Pendanaan'
        verbose_name_plural = 'Daftar Pendanaan'

    def __str__(self):
        return f"{self.source_name} - {self.get_source_type_display()}"