from django.urls import path
from . import views  

urlpatterns = [
    path('aset/', views.list_aset, name='list-aset'),
    path('aset/tambah/', views.tambah_aset, name='tambah-aset'),
    path('aset/<int:pk>/', views.asset_detail, name='detail-aset'),
]