from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Gunakan Router untuk membuat endpoint otomatis
router = DefaultRouter()
# Ini akan membuat URL: /api/dashboard/dashboard-config/
router.register(r'dashboard-config', views.DashboardViewSet, basename='dashboard-config')

urlpatterns = [
    path('', include(router.urls)),
]