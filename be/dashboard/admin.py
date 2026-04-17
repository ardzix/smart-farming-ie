from django.contrib import admin
from .models import SystemConfig

# Daftarkan model agar muncul di panel admin Django
admin.site.register(SystemConfig)