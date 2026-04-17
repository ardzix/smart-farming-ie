from rest_framework import serializers
from .models import Asset

class AsetSerializer(serializers.ModelSerializer):
    # [FIX] Gunakan SerializerMethodField agar tidak error 'AttributeError'
    investors_info = serializers.SerializerMethodField()
    total_investment = serializers.SerializerMethodField()
    
    # Format gambar agar tampil URL lengkap
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
        # [FIX] Hitung manual atau return 0 agar aman
        try:
            # Jika nanti ada model Ownership, hitung di sini. 
            # Untuk sekarang return 0 atau value aset.
            return getattr(obj, 'value', 0)
        except Exception:
            return 0

    def get_investors_info(self, obj):
        """
        Mengambil info investor dari tabel Ownership (Apps lain).
        """
        try:
            # Gunakan getattr untuk menghindari crash jika relation belum ada
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
            raise serializers.ValidationError("Persentase harus antara 0-100")
        return value