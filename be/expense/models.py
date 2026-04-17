from django.db import models
from django.utils import timezone

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('OPERATIONAL', 'Operational Cost'),
        ('SALARY', 'Salary/Wages'),
        ('ASSET_PURCHASE', 'Asset Purchase'),
        ('TAX', 'Tax & Legal'),
        ('OTHERS', 'Others'),
    ]

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OPERATIONAL')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    date = models.DateField(default=timezone.now)
    recipient = models.CharField(max_length=255, null=True, blank=True, help_text="Who received the money?")
    
    description = models.TextField(null=True, blank=True)
    proof_image = models.ImageField(upload_to='expenses/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.title} - {self.amount}"