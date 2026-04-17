from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_expense, name='list-expense'),  # Hapus 'expenses/'
    path('<int:pk>/', views.expense_detail, name='expense-detail'),
]