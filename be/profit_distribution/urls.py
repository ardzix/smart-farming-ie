from django.urls import path
from . import views

urlpatterns = [
    # list_create_distributions menangani GET list & POST save
    path('', views.list_create_distributions, name='list-create-distribution'),
    
    # Endpoint khusus kalkulator preview
    path('preview/', views.preview_distribution, name='preview-distribution'),
    
    # Detail & Delete
    path('<int:pk>/', views.distribution_detail, name='detail-distribution'),
]