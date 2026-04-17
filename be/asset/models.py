from django.db import models

class Asset(models.Model):
    # --- PILIHAN (SAMA PERSIS DENGAN KODE LAMA) ---
    ASSET_TYPES = [
        ('lahan', 'Lahan'),
        ('alat', 'Alat'),
        ('bangunan', 'Bangunan'),
        ('ternak', 'Ternak'),
    ]

    OWNERSHIP_STATUS_CHOICES = [
        ('full_ownership', 'Full Ownership'),
        ('partial_ownership', 'Partial Ownership'),
        ('investor_owned', 'Investor Owned'),
        ('leashold', 'Leased'),
        ('under_construction', 'Under Construction'),
        ('personal_ownership', 'Personal Ownership'),
    ]

    # --- FIELD ---
    name = models.CharField(max_length=100, verbose_name='Nama Aset')
    
    # Tipe Aset
    type = models.CharField(max_length=100, choices=ASSET_TYPES, verbose_name='Tipe Aset')
    
    location = models.CharField(max_length=100, verbose_name='Lokasi')
    size = models.FloatField(verbose_name='Ukuran (m²)', null=True, blank=True)
    
    value = models.DecimalField(max_digits=20, decimal_places=2, verbose_name='Nilai Aset')
    acquisition_date = models.DateField(verbose_name='Tanggal Akuisisi')
    
    # Status Kepemilikan
    ownership_status = models.CharField(
        max_length=50, 
        choices=OWNERSHIP_STATUS_CHOICES,
        verbose_name='Status Kepemilikan'
    )
    
    # [INFO PEMILIK] Hanya teks, tidak ada tabel terpisah
    landowner = models.CharField(max_length=100, null=True, blank=True, verbose_name='Nama Pemilik Lahan')
    
    # Persentase Bagi Hasil (Angka)
    landowner_share_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name='% Bagi Hasil Pemilik'
    )

    # [UPLOAD] Ganti document_url jadi ImageField
    image = models.ImageField(upload_to='assets/', null=True, blank=True, verbose_name='Foto/Dokumen')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Aset'
        verbose_name_plural = 'Aset'