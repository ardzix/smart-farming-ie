from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import HasSSOPermission
from .models import SiteSetting
from .serializers import SiteSettingSerializer

@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('site_settings')])
def settings_view(request):
    # Always work with the singleton row (ID=1); create it if missing
    setting_obj, created = SiteSetting.objects.get_or_create(pk=1)

    # GET: return the current settings
    if request.method == 'GET':
        serializer = SiteSettingSerializer(setting_obj)
        return Response(serializer.data)

    # POST: update the settings payload
    elif request.method == 'POST':
        serializer = SiteSettingSerializer(setting_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)