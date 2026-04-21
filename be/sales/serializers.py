from rest_framework import serializers
from .models import Sale

class SaleSerializer(serializers.ModelSerializer):
    # Additional read-only fields for frontend display
    product_name = serializers.SerializerMethodField()
    product_unit = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        # Keep these fields aligned with sales/models.py
        fields = [
            'id', 
            'product',       # Input product ID
            'product_name',  # Output product name
            'product_unit',  # Output product unit
            'quantity', 
            'price_per_unit', 
            'total_price', 
            'buyer_name', 
            'date', 
            'proof_image'    # Stored on the Sale model
        ]
        read_only_fields = ['total_price']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown"

    def get_product_unit(self, obj):
        return obj.product.unit if obj.product else ""