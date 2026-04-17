from django.urls import path
from . import views

urlpatterns = [
    path('', views.settings_view, name='site-settings'),
]