from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Asset

class AsetSerializer(serializers.ModelSerializer):
    # Use SerializerMethodField to avoid AttributeError when optional relations are missing
    investors_info = serializers.SerializerMethodField()
    total_investment = serializers.SerializerMethodField()
    
    # Return absolute image URLs when available
    image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = Asset
        fields = [
            'id', 
            'name', 
            'type',           
            'location', 
            'size', 
            'value',
            'acquisition_date', 
            'ownership_status', 
            'image',            
            'landowner',        
            'landowner_share_percentage', 
            'total_investment',
            'investors_info', 
            'created_at'
        ]
    
    def get_total_investment(self, obj):
        # Return a safe fallback when ownership data is unavailable
        try:
            # If an Ownership model is reintroduced, calculate the total here. 
            # For now, return a safe asset value fallback.
            return getattr(obj, 'value', 0)
        except Exception:
            return 0

    def get_investors_info(self, obj):
        """
        Mengambil info investor dari tabel Ownership (Apps lain).
        """
        try:
            # Guard against missing relations so the serializer stays resilient
            if not hasattr(obj, 'ownerships'):
                return []
                
            ownerships = obj.ownerships.select_related('investor__user').all()
            return [
                {
                    'investor_id': o.investor.id,
                    'investor_name': o.investor.user.username,
                    'units': o.units,
                    'ownership_percentage': o.ownership_percentage,
                    'investment_date': o.investment_date
                }
                for o in ownerships
            ]
        except Exception:
            return []

class AsetCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer khusus untuk Input Data (Create/Update).
    """
    image = serializers.ImageField(required=False)

    class Meta:
        model = Asset
        fields = [
            'name', 'type', 'location', 'size', 'value',
            'acquisition_date', 'ownership_status', 'image',
            'landowner', 'landowner_share_percentage'
        ]
    
    def validate_landowner_share_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError(_("Percentage must be between 0 and 100"))
        return value
