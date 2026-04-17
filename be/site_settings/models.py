from django.db import models

class SiteSetting(models.Model):
    # Konfigurasi Saham
    total_shares = models.PositiveIntegerField(default=10000, help_text="Total lembar saham yang diterbitkan perusahaan")
    share_price = models.DecimalField(max_digits=15, decimal_places=2, default=1000000, help_text="Harga per lembar saham (Estimasi)")
    max_share_per_investor = models.PositiveIntegerField(default=50, help_text="Maksimal persentase kepemilikan per investor (0-100)")

    # Profil Perusahaan
    company_name = models.CharField(max_length=100, default="Integrated Estate")
    support_email = models.EmailField(default="admin@lahanpintar.com")
    
    # System Prefs
    enable_notifications = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Pastikan hanya ada 1 ID (ID=1) agar jadi Singleton
        self.pk = 1
        super(SiteSetting, self).save(*args, **kwargs)

    def __str__(self):
        return "Konfigurasi Utama Sistem"