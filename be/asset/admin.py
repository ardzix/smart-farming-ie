from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'type', 
        'location', 
        'ownership_status', 
        'landowner', 
        'acquisition_date'
    )
    list_filter = ('type', 'ownership_status')
    search_fields = ('name', 'location', 'landowner')