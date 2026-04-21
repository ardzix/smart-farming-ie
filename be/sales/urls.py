from django.urls import path
from . import views

urlpatterns = [
    # Handles GET list and POST create
    path('sales/', views.list_create_sales, name='list-create-sales'),
    
    # Handles retrieve, update, and delete
    path('sales/<int:pk>/', views.sale_detail, name='detail-sale'),
]