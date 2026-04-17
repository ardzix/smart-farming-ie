# dashboard/views.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import SystemConfig
from .serializers import SystemConfigSerializer

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        # [FIX] Gunakan model + serializer, BUKAN agregasi manual
        config, _ = SystemConfig.objects.get_or_create(id=1)
        serializer = SystemConfigSerializer(config)
        
        # Debug print akan muncul saat serializer.data dipanggil
        return Response(serializer.data)