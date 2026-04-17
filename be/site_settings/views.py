from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import HasSSOPermission
from .models import SiteSetting
from .serializers import SiteSettingSerializer

@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('site_settings')])
def settings_view(request):
    # Selalu ambil objek pertama (ID=1), jika tidak ada buat baru
    setting_obj, created = SiteSetting.objects.get_or_create(pk=1)

    # GET: Tampilkan Data
    if request.method == 'GET':
        serializer = SiteSettingSerializer(setting_obj)
        return Response(serializer.data)

    # POST: Update Data (Hanya Superadmin)
    elif request.method == 'POST':
        serializer = SiteSettingSerializer(setting_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)