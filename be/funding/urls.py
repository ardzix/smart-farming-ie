from django.urls import path
from . import views

urlpatterns = [
    # Endpoint untuk List (GET)
    path('', views.list_funding, name='list-funding'),
    
    # [FIX] Tambahkan endpoint untuk Create (POST)
    path('tambah/', views.create_funding, name='create-funding'),
    
    # Endpoint untuk Detail/Update/Delete
    path('<int:pk>/', views.funding_detail, name='detail-funding'),
]