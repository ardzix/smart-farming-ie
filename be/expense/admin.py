from django.contrib import admin
from .models import Expense

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        'title', 
        'category', 
        'amount', 
        'recipient', 
        'date'
    )
    list_filter = ('category', 'date')
    search_fields = ('title', 'recipient', 'description')
    ordering = ('-date',)