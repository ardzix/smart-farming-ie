from rest_framework import serializers
from .models import Sale

class SaleSerializer(serializers.ModelSerializer):
    # Field tambahan untuk tampilan frontend (Read Only)
    product_name = serializers.SerializerMethodField()
    product_unit = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        # Sesuaikan field dengan sales/models.py yang Anda kirim
        fields = [
            'id', 
            'product',       # Input ID
            'product_name',  # Output Nama
            'product_unit',  # Output Unit
            'quantity', 
            'price_per_unit', 
            'total_price', 
            'buyer_name', 
            'date', 
            'proof_image'    # Ada di model Anda
        ]
        read_only_fields = ['total_price']

    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown"

    def get_product_unit(self, obj):
        return obj.product.unit if obj.product else ""