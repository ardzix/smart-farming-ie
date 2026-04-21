from rest_framework import serializers
from .models import Production, Product, StockAdjustment

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class ProductionSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    asset_details = serializers.SerializerMethodField()

    class Meta:
        model = Production
        fields = [
            'id', 
            'asset', 'asset_details', 
            'product', 'product_details', 
            'quantity', 
            'unit_price', 
            'date', 'status', 
            'created_at', 'updated_at'
        ]

    def get_product_details(self, obj):
        if not obj.product:
            return None
        return {
            "id": obj.product.id,
            "name": obj.product.name,
            "unit": obj.product.unit,
            "current_stock": obj.product.current_stock 
        }

    def get_asset_details(self, obj):
        if not obj.asset:
            return None
        return {
            "id": obj.asset.id,
            "name": obj.asset.name,
            "type": getattr(obj.asset, 'type', 'Unknown') 
        }


# ==========================================
# STOCK ADJUSTMENT SERIALIZER
# ==========================================
class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    proof_image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)
    
    # Additional display fields for the frontend
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'product', 'product_details', 
            'adjustment_type', 'adjustment_type_display',
            'quantity', 'reason', 'reason_display',
            'notes', 'date', 'proof_image', 
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_product_details(self, obj):
        if not obj.product:
            return None
        return {
            "id": obj.product.id,
            "name": obj.product.name,
            "unit": obj.product.unit,
            "current_stock": obj.product.current_stock
        }
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.username
        return "System"