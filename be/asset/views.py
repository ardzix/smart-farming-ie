from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Asset
from .serializers import AsetSerializer, AsetCreateUpdateSerializer
from authentication.permissions import HasSSOPermission
from rest_framework.permissions import IsAuthenticated 

@api_view(['GET'])
@permission_classes([HasSSOPermission('asset')])
def list_aset(request):
    # Menggunakan select_related/prefetch_related jika nanti ada relasi foreign key untuk performa
    assets = Asset.objects.all().order_by('-created_at')
    serializer = AsetSerializer(assets, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([HasSSOPermission('asset')])
@parser_classes([MultiPartParser, FormParser]) 
def tambah_aset(request):
    serializer = AsetCreateUpdateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        instance = serializer.save()
        # Return data menggunakan serializer standar agar format konsisten dengan GET
        read_serializer = AsetSerializer(instance, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([HasSSOPermission('asset')])
@parser_classes([MultiPartParser, FormParser]) 
def asset_detail(request, pk):
    try:
        asset = Asset.objects.get(pk=pk)
    except Asset.DoesNotExist:
        return Response({'error': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = AsetSerializer(asset, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = AsetCreateUpdateSerializer(asset, data=request.data, context={'request': request})
        if serializer.is_valid():
            instance = serializer.save()
            read_serializer = AsetSerializer(instance, context={'request': request})
            return Response(read_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if asset.image:
            asset.image.delete(save=False)
        asset.delete()
        return Response({'message': 'Asset deleted successfully'}, status=status.HTTP_204_NO_CONTENT)