from rest_framework import serializers
from .models import ProfitDistribution, ProfitDistributionItem
from django.db.models import Sum

class ProfitDistributionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfitDistributionItem
        fields = '__all__'

class ProfitDistributionSerializer(serializers.ModelSerializer):
    items = ProfitDistributionItemSerializer(many=True, read_only=True)
    
    # Additional computed fields for summary statistics
    real_distributed = serializers.SerializerMethodField()
    landowner_portion = serializers.SerializerMethodField()
    investor_portion = serializers.SerializerMethodField()
    retained_portion = serializers.SerializerMethodField() # Remaining undistributed amount

    class Meta:
        model = ProfitDistribution
        fields = [
            'id', 'date', 'total_distributed', 'notes', 'created_at', 
            'items', 'real_distributed', 'landowner_portion', 
            'investor_portion', 'retained_portion'
        ]

    def get_real_distributed(self, obj):
        # Amount actually distributed through concrete payout items
        return obj.items.aggregate(Sum('amount'))['amount__sum'] or 0

    def get_landowner_portion(self, obj):
        return obj.items.filter(role='Landowner').aggregate(Sum('amount'))['amount__sum'] or 0

    def get_investor_portion(self, obj):
        return obj.items.filter(role='Investor').aggregate(Sum('amount'))['amount__sum'] or 0

    def get_retained_portion(self, obj):
        # Remainder = planned total input - actual distributed total
        real = self.get_real_distributed(obj)
        return obj.total_distributed - real