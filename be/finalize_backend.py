import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"✅ Upgraded: {path}")

print("🚀 MEMULAI FINALISASI BACKEND (MATANG)...")

# ==========================================
# 1. SETTINGS (Aktifkan Media Upload)
# ==========================================
# Kita baca settings lama dan pastikan konfigurasi MEDIA ada
write_file('smart_land/settings.py', """
from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-*h_(c9)yydu8u7lsp)9d#z!p*5j6b%6m)4)y2$b%-pfcpp5lz6'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

AUTH_USER_MODEL = 'authentication.CustomUser'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',  # Tambahan untuk fitur filter
    
    # Apps Lahan Pintar
    'authentication',
    'asset',
    'funding',
    'expense',
    'production',
    'sales',
    'profit_distribution',
    'dashboard',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication.authentication.CookieJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKEN': True,
    'ALGORITHM': 'HS256', 
    'SIGNING_KEY': SECRET_KEY,  
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'smart_land.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smart_land.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'id-ID' # Pakai Indonesia
TIME_ZONE = 'Asia/Jakarta' # Waktu Indonesia
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# KONFIGURASI UPLOAD MEDIA (PENTING)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = ['accept', 'accept-encoding', 'authorization', 'content-type', 'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with']
""")

# ==========================================
# 2. UPDATE ASSET (Gambar Upload & Search)
# ==========================================
write_file('asset/models.py', """
from django.db import models

class Aset(models.Model):
    nama = models.CharField(max_length=255)
    deskripsi = models.TextField(null=True, blank=True)
    lokasi = models.CharField(max_length=255, null=True, blank=True)
    
    # Ubah ke ImageField untuk upload
    gambar = models.ImageField(upload_to='assets/', null=True, blank=True)
    
    is_sewa_lahan = models.BooleanField(default=False)
    pemilik_lahan = models.CharField(max_length=255, null=True, blank=True)
    persentase_bagi_hasil_lahan = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nama
""")

write_file('asset/views.py', """
from rest_framework import viewsets, filters
from .models import Aset
from .serializers import AsetSerializer
from rest_framework.permissions import IsAuthenticated

class AsetViewSet(viewsets.ModelViewSet):
    queryset = Aset.objects.all().order_by('-created_at')
    serializer_class = AsetSerializer
    permission_classes = [IsAuthenticated]
    
    # Fitur Pencarian
    filter_backends = [filters.SearchFilter]
    search_fields = ['nama', 'lokasi', 'pemilik_lahan']
""")

# ==========================================
# 3. UPDATE FUNDING (Search)
# ==========================================
write_file('funding/views.py', """
from rest_framework import viewsets, filters
from .models import Pendanaan
from .serializers import PendanaanSerializer
from rest_framework.permissions import IsAuthenticated

class PendanaanViewSet(viewsets.ModelViewSet):
    queryset = Pendanaan.objects.all().order_by('-tanggal_diterima')
    serializer_class = PendanaanSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['nama_sumber', 'deskripsi']
""")

# ==========================================
# 4. UPDATE EXPENSE (Upload Bukti & Search)
# ==========================================
write_file('expense/models.py', """
from django.db import models
from django.utils import timezone

class Pengeluaran(models.Model):
    judul = models.CharField(max_length=255)
    jumlah = models.DecimalField(max_digits=15, decimal_places=2)
    tanggal = models.DateField(default=timezone.now)
    deskripsi = models.TextField(null=True, blank=True)
    
    # Upload Bukti Struk/Nota
    bukti_gambar = models.ImageField(upload_to='expenses/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.judul} - Rp {self.jumlah}"
""")

write_file('expense/views.py', """
from rest_framework import viewsets, filters
from .models import Pengeluaran
from .serializers import PengeluaranSerializer
from rest_framework.permissions import IsAuthenticated

class PengeluaranViewSet(viewsets.ModelViewSet):
    queryset = Pengeluaran.objects.all().order_by('-tanggal')
    serializer_class = PengeluaranSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['judul', 'deskripsi']
""")

# ==========================================
# 5. UPDATE PRODUCTION (Search)
# ==========================================
write_file('production/views.py', """
from rest_framework import viewsets, filters
from .models import Produksi
from .serializers import ProduksiSerializer
from rest_framework.permissions import IsAuthenticated

class ProduksiViewSet(viewsets.ModelViewSet):
    queryset = Produksi.objects.all().order_by('-tanggal_produksi')
    serializer_class = ProduksiSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['nama_produk', 'aset__nama']
""")

# ==========================================
# 6. UPDATE SALES (Upload Bukti & Search)
# ==========================================
write_file('sales/models.py', """
from django.db import models
from django.utils import timezone

class Penjualan(models.Model):
    nama_produk_terjual = models.CharField(max_length=255) 
    kuantitas = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    
    harga_per_unit = models.DecimalField(max_digits=15, decimal_places=2)
    total_penjualan = models.DecimalField(max_digits=15, decimal_places=2, editable=False)
    
    tanggal_terjual = models.DateField(default=timezone.now)
    
    # Upload Bukti Transfer/Nota
    bukti_transaksi = models.ImageField(upload_to='sales/', null=True, blank=True)
    
    catatan = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_penjualan = self.kuantitas * self.harga_per_unit
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Jual {self.nama_produk_terjual} - Rp {self.total_penjualan}"
""")

write_file('sales/views.py', """
from rest_framework import viewsets, filters
from .models import Penjualan
from .serializers import PenjualanSerializer
from rest_framework.permissions import IsAuthenticated

class PenjualanViewSet(viewsets.ModelViewSet):
    queryset = Penjualan.objects.all().order_by('-tanggal_terjual')
    serializer_class = PenjualanSerializer
    permission_classes = [IsAuthenticated]
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['nama_produk_terjual', 'catatan']
""")

# ==========================================
# 7. ROUTING MEDIA (Agar gambar bisa dibuka)
# ==========================================
write_file('smart_land/urls.py', """
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/assets/', include('asset.urls')),
    path('api/funding/', include('funding.urls')),
    path('api/expenses/', include('expense.urls')),
    path('api/production/', include('production.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/profit-distribution/', include('profit_distribution.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]

# Tambahkan ini agar bisa akses file media/upload
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
""")

print("✅ SELESAI. Backend sekarang mendukung Upload Gambar dan Pencarian.")
print("👉 Silakan jalankan 'reset_backend.bat' satu kali lagi untuk menerapkan perubahan database.")