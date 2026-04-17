from rest_framework import serializers
from .models import Funding

class FundingSerializer(serializers.ModelSerializer):
    proof_image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = Funding
        fields = '__all__'

    # [LOGIKA TAMBAHAN] Sesuai request atasan
    def validate(self, data):
        # Cek apa yang dipilih user
        tipe = data.get('source_type')
        saham = data.get('shares')

        # Kalau Investor, WAJIB punya saham
        if tipe == 'investor' and not saham:
            raise serializers.ValidationError({
                "shares": "Untuk tipe Investor, jumlah lembar saham wajib diisi."
            })
        
        return data