from django.contrib import admin
from .models import Funding

@admin.register(Funding)
class FundingAdmin(admin.ModelAdmin):
    list_display = (
        'source_name', 
        'source_type', 
        'amount', 
        'shares', 
        'date_received', 
        'payment_method'
    )
    list_filter = ('source_type', 'payment_method', 'date_received')
    search_fields = ('source_name', 'notes')
    ordering = ('-date_received',)