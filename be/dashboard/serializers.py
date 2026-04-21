# dashboard/serializers.py
from rest_framework import serializers
from .models import SystemConfig

class SystemConfigSerializer(serializers.ModelSerializer):
    # No `source` argument is needed when the serializer field matches the model method name
    total_assets = serializers.ReadOnlyField()
    total_asset_value = serializers.ReadOnlyField()
    total_funding = serializers.ReadOnlyField()
    total_revenue = serializers.ReadOnlyField()
    total_expense = serializers.ReadOnlyField()
    total_yield = serializers.ReadOnlyField()
    total_cash_on_hand = serializers.ReadOnlyField()
    shares_sold = serializers.ReadOnlyField()
    shares_available = serializers.ReadOnlyField()

    class Meta:
        model = SystemConfig
        fields = '__all__'