from rest_framework import serializers
from .models import Expense

class ExpenseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class ExpenseDetailSerializer(serializers.ModelSerializer):
    # Field proof_image otomatis di-handle DRF menjadi URL jika ada filenya
    proof_image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = Expense
        fields = [
            'id', 
            'title',       # Pastikan title masuk
            'category', 
            'amount', 
            'date', 
            'recipient',   # Pastikan recipient masuk
            'description', 
            'proof_image', # Sesuaikan dengan nama di Model (bukan proof_url)
            'created_at'
        ]