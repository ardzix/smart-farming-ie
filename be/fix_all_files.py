import os

# Fungsi untuk menulis file
def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"✅ Fixed: {path}")

# ==========================================
# 1. SMART LAND URLS (Router Utama)
# ==========================================
write_file('smart_land/urls.py', """
from django.contrib import admin
from django.urls import path, include

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
""")

# ==========================================
# 2. AUTHENTICATION (User & Login)
# ==========================================
write_file('authentication/urls.py', """
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
]
""")

# ==========================================
# 3. PRODUCTION (Produksi - Penyebab Error Terakhir)
# ==========================================
write_file('production/urls.py', """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProduksiViewSet

router = DefaultRouter()
router.register(r'', ProduksiViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file('production/views.py', """
from rest_framework import viewsets
from .models import Produksi
from .serializers import ProduksiSerializer
from rest_framework.permissions import IsAuthenticated

class ProduksiViewSet(viewsets.ModelViewSet):
    queryset = Produksi.objects.all().order_by('-tanggal_produksi')
    serializer_class = ProduksiSerializer
    permission_classes = [IsAuthenticated]
""")

write_file('production/serializers.py', """
from rest_framework import serializers
from .models import Produksi
from asset.serializers import AsetSerializer

class ProduksiSerializer(serializers.ModelSerializer):
    # Read only nested serializer untuk detail aset
    aset_detail = AsetSerializer(source='aset', read_only=True)

    class Meta:
        model = Produksi
        fields = '__all__'
""")

# ==========================================
# 4. SALES (Penjualan)
# ==========================================
write_file('sales/urls.py', """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PenjualanViewSet

router = DefaultRouter()
router.register(r'', PenjualanViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file('sales/views.py', """
from rest_framework import viewsets
from .models import Penjualan
from .serializers import PenjualanSerializer
from rest_framework.permissions import IsAuthenticated

class PenjualanViewSet(viewsets.ModelViewSet):
    queryset = Penjualan.objects.all().order_by('-tanggal_terjual')
    serializer_class = PenjualanSerializer
    permission_classes = [IsAuthenticated]
""")

write_file('sales/serializers.py', """
from rest_framework import serializers
from .models import Penjualan

class PenjualanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Penjualan
        fields = '__all__'
""")

# ==========================================
# 5. FUNDING (Pendanaan)
# ==========================================
write_file('funding/urls.py', """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PendanaanViewSet

router = DefaultRouter()
router.register(r'', PendanaanViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file('funding/views.py', """
from rest_framework import viewsets
from .models import Pendanaan
from .serializers import PendanaanSerializer
from rest_framework.permissions import IsAuthenticated

class PendanaanViewSet(viewsets.ModelViewSet):
    queryset = Pendanaan.objects.all().order_by('-tanggal_diterima')
    serializer_class = PendanaanSerializer
    permission_classes = [IsAuthenticated]
""")

write_file('funding/serializers.py', """
from rest_framework import serializers
from .models import Pendanaan

class PendanaanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pendanaan
        fields = '__all__'
""")

# ==========================================
# 6. EXPENSE (Pengeluaran)
# ==========================================
write_file('expense/urls.py', """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PengeluaranViewSet

router = DefaultRouter()
router.register(r'', PengeluaranViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file('expense/views.py', """
from rest_framework import viewsets
from .models import Pengeluaran
from .serializers import PengeluaranSerializer
from rest_framework.permissions import IsAuthenticated

class PengeluaranViewSet(viewsets.ModelViewSet):
    queryset = Pengeluaran.objects.all().order_by('-tanggal')
    serializer_class = PengeluaranSerializer
    permission_classes = [IsAuthenticated]
""")

write_file('expense/serializers.py', """
from rest_framework import serializers
from .models import Pengeluaran

class PengeluaranSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pengeluaran
        fields = '__all__'
""")

# ==========================================
# 7. ASSET (Aset)
# ==========================================
write_file('asset/urls.py', """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AsetViewSet

router = DefaultRouter()
router.register(r'', AsetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file('asset/views.py', """
from rest_framework import viewsets
from .models import Aset
from .serializers import AsetSerializer
from rest_framework.permissions import IsAuthenticated

class AsetViewSet(viewsets.ModelViewSet):
    queryset = Aset.objects.all()
    serializer_class = AsetSerializer
    permission_classes = [IsAuthenticated]
""")

write_file('asset/serializers.py', """
from rest_framework import serializers
from .models import Aset

class AsetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aset
        fields = '__all__'
""")

# ==========================================
# 8. PROFIT DISTRIBUTION (Bagi Hasil)
# ==========================================
write_file('profit_distribution/urls.py', """
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BagiHasilViewSet

router = DefaultRouter()
router.register(r'', BagiHasilViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
""")

write_file('profit_distribution/views.py', """
from rest_framework import viewsets
from .models import BagiHasil
from .serializers import BagiHasilSerializer
from rest_framework.permissions import IsAuthenticated

class BagiHasilViewSet(viewsets.ModelViewSet):
    queryset = BagiHasil.objects.all().order_by('-tanggal_pembagian')
    serializer_class = BagiHasilSerializer
    permission_classes = [IsAuthenticated]
""")

write_file('profit_distribution/serializers.py', """
from rest_framework import serializers
from .models import BagiHasil

class BagiHasilSerializer(serializers.ModelSerializer):
    class Meta:
        model = BagiHasil
        fields = '__all__'
""")

# ==========================================
# 9. DASHBOARD (Ringkasan)
# ==========================================
write_file('dashboard/urls.py', """
from django.urls import path
from .views import DashboardSummaryView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]
""")

write_file('dashboard/views.py', """
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from funding.models import Pendanaan
from expense.models import Pengeluaran
from asset.models import Aset
from sales.models import Penjualan

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_dana_masuk = Pendanaan.objects.aggregate(Sum('jumlah_dana'))['jumlah_dana__sum'] or 0
        total_pengeluaran = Pengeluaran.objects.aggregate(Sum('jumlah'))['jumlah__sum'] or 0
        total_penjualan = Penjualan.objects.aggregate(Sum('total_penjualan'))['total_penjualan__sum'] or 0
        
        saldo_kas = (total_dana_masuk + total_penjualan) - total_pengeluaran

        return Response({
            "total_pendanaan": total_dana_masuk,
            "total_pengeluaran": total_pengeluaran,
            "total_penjualan": total_penjualan,
            "saldo_kas_saat_ini": saldo_kas,
            "jumlah_aset": Aset.objects.count(),
        })
""")

print("\n🚀 SEMUA FILE BERHASIL DIPERBAIKI! SILAKAN JALANKAN reset_backend.bat SEKARANG.")