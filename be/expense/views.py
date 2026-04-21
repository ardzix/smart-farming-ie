from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Expense
from .serializers import ExpenseCreateUpdateSerializer, ExpenseDetailSerializer
from authentication.permissions import HasSSOPermission

@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('expense')])
@parser_classes([MultiPartParser, FormParser]) # Enable image uploads
def list_expense(request):
    if request.method == 'GET':
        # 1. Base query (without removed project/funding relations)
        queryset = Expense.objects.all().order_by('-date')
        
        # 2. Search logic
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) | 
                Q(title__icontains=search)
            )
        
        # 3. Category filter
        category = request.query_params.get('category')
        if category and category != 'all':
            queryset = queryset.filter(category=category)
        
        serializer = ExpenseDetailSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ExpenseCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            expense = serializer.save()
            # Pass request context so image URLs are returned as absolute URLs
            return_data = ExpenseDetailSerializer(expense, context={'request': request}).data
            return Response(return_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([HasSSOPermission('expense')])
@parser_classes([MultiPartParser, FormParser])
def expense_detail(request, pk):
    try:
        expense = Expense.objects.get(pk=pk)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ExpenseDetailSerializer(expense, context={'request': request})
        return Response(serializer.data)

    # Edit/delete is already enforced by permission_classes
    # Read-only roles are already restricted above; keep this note for future maintainers
    
    if request.method == 'PUT':
        serializer = ExpenseCreateUpdateSerializer(expense, data=request.data, partial=True)
        if serializer.is_valid():
            expense = serializer.save()
            return_data = ExpenseDetailSerializer(expense, context={'request': request}).data
            return Response(return_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)