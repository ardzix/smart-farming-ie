from django.urls import path
from . import views

urlpatterns = [
    # Ini menangani GET List dan POST Create (Solusi Error 405)
    path('sales/', views.list_create_sales, name='list-create-sales'),
    
    # Ini menangani Detail, Update, Delete
    path('sales/<int:pk>/', views.sale_detail, name='detail-sale'),
]