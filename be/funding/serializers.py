from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Funding

class FundingSerializer(serializers.ModelSerializer):
    proof_image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = Funding
        fields = '__all__'

    # Additional validation for investor funding rows
    def validate(self, data):
        # Inspect the selected funding source type
        tipe = data.get('source_type')
        saham = data.get('shares')

        # Investor entries must include share units
        if tipe == 'investor' and not saham:
            raise serializers.ValidationError({
                "shares": _("Investor funding requires a share count.")
            })
        
        return data
