from django.urls import path
from . import views

urlpatterns = [
    # API Produk (Master Data)
    path('products/', views.list_create_products, name='list-create-products'),

    # API Produksi (Transaksi) - Menangani List & Create
    path('productions/', views.list_create_productions, name='list-create-productions'),

    # API Detail (Update & Delete)
    path('productions/<int:pk>/', views.production_detail, name='detail-production'),
    
    # ==========================================
    # API STOCK ADJUSTMENT (BARU)
    # ==========================================
    path('adjustments/', views.list_create_adjustments, name='list-create-adjustments'),
    path('adjustments/<int:pk>/', views.adjustment_detail, name='detail-adjustment'),
]