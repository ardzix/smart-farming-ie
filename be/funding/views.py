from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Funding
from .serializers import FundingSerializer
from authentication.permissions import HasSSOPermission
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([HasSSOPermission('funding')])
def list_funding(request):
    # Filter opsional: ?type=investor
    source_type = request.query_params.get('type')
    search = request.query_params.get('search')
    
    queryset = Funding.objects.all()
    
    if source_type:
        queryset = queryset.filter(source_type=source_type)
    if search:
        queryset = queryset.filter(source_name__icontains=search)
        
    serializer = FundingSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([HasSSOPermission('funding')])
@parser_classes([MultiPartParser, FormParser]) # Support Upload
def create_funding(request):
    serializer = FundingSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([HasSSOPermission('funding')])
@parser_classes([MultiPartParser, FormParser])
def funding_detail(request, pk):
    try:
        funding = Funding.objects.get(pk=pk)
    except Funding.DoesNotExist:
        return Response({'error': 'Data not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = FundingSerializer(funding, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = FundingSerializer(funding, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if funding.proof_image:
            funding.proof_image.delete(save=False)
        funding.delete()
        return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)