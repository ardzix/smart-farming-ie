from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Use a router to generate the viewset routes
router = DefaultRouter()
# This exposes the URL /api/dashboard/dashboard-config/
router.register(r'dashboard-config', views.DashboardViewSet, basename='dashboard-config')

urlpatterns = [
    path('', include(router.urls)),
]