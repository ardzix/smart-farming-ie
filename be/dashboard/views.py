# dashboard/views.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import SystemConfig
from .serializers import SystemConfigSerializer

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        # Use the model + serializer pipeline instead of ad-hoc aggregation
        config, _ = SystemConfig.objects.get_or_create(id=1)
        serializer = SystemConfigSerializer(config)
        
        # The serializer computes aggregate fields when serializer.data is accessed
        return Response(serializer.data)