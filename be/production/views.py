from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
import traceback
from django.db import transaction

from .models import Production, Product, StockAdjustment
from .serializers import ProductionSerializer, ProductSerializer, StockAdjustmentSerializer
from authentication.permissions import HasSSOPermission 

# ==========================================
# 1. MASTER PRODUK
# ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def list_create_products(request):
    try:
        if request.method == 'GET':
            search_query = request.query_params.get('search', None)
            products = Product.objects.all().order_by('name')
            if search_query:
                products = products.filter(name__icontains=search_query)
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = ProductSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print("ERROR PRODUCT:", str(e))
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# 2. TRANSAKSI PRODUKSI
# ==========================================
@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('production')])
def list_create_productions(request):
    try:
        if request.method == 'GET':
            queryset = Production.objects.select_related('asset', 'product').all().order_by('-date')
            
            asset_id = request.query_params.get('asset')
            search = request.query_params.get('search')
            
            if asset_id and asset_id != 'all':
                queryset = queryset.filter(asset_id=asset_id)
            if search:
                queryset = queryset.filter(product__name__icontains=search)

            serializer = ProductionSerializer(queryset, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            with transaction.atomic():
                serializer = ProductionSerializer(data=request.data)
                if serializer.is_valid():
                    production = serializer.save()
                    
                    # [LOGIC STOK] Tambah Stok saat Create
                    if production.status == 'stok':
                        product = production.product
                        product.current_stock += production.quantity
                        product.save()

                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print("CRITICAL ERROR PRODUKSI:", str(e))
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# 3. DETAIL PRODUKSI
# ==========================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([HasSSOPermission('production')])
def production_detail(request, pk):
    try:
        production = Production.objects.get(pk=pk)
    except Production.DoesNotExist:
        return Response({'error': 'Data not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        if request.method == 'GET':
            serializer = ProductionSerializer(production)
            return Response(serializer.data)

        elif request.method in ['PUT', 'PATCH']:
            with transaction.atomic():
                old_qty = production.quantity
                
                partial = request.method == 'PATCH'
                serializer = ProductionSerializer(production, data=request.data, partial=partial)
                if serializer.is_valid():
                    updated_prod = serializer.save()
                    
                    # [LOGIC STOK] Update selisih
                    if updated_prod.status == 'stok':
                        product = updated_prod.product
                        diff = updated_prod.quantity - old_qty
                        product.current_stock += diff
                        product.save()

                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            with transaction.atomic():
                # [LOGIC STOK] Kurangi Stok saat Hapus
                if production.status == 'stok':
                    product = production.product
                    product.current_stock -= production.quantity
                    product.save()
                
                production.delete()
                return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        print("ERROR DETAIL:", str(e))
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# 4. STOCK ADJUSTMENT (BARU)
# ==========================================
@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('production')])
@parser_classes([MultiPartParser, FormParser])
def list_create_adjustments(request):
    try:
        if request.method == 'GET':
            queryset = StockAdjustment.objects.select_related('product', 'created_by').all().order_by('-date', '-created_at')
            
            # Filter berdasarkan produk
            product_id = request.query_params.get('product')
            if product_id:
                queryset = queryset.filter(product_id=product_id)
            
            # Filter berdasarkan tipe adjustment
            adjustment_type = request.query_params.get('type')
            if adjustment_type and adjustment_type != 'all':
                queryset = queryset.filter(adjustment_type=adjustment_type)

            serializer = StockAdjustmentSerializer(queryset, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            with transaction.atomic():
                serializer = StockAdjustmentSerializer(data=request.data, context={'request': request})
                if serializer.is_valid():
                    # Set user yang membuat adjustment
                    adjustment = serializer.save(created_by=request.user)
                    
                    return Response(
                        StockAdjustmentSerializer(adjustment, context={'request': request}).data,
                        status=status.HTTP_201_CREATED
                    )
                
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print("ERROR ADJUSTMENT:", str(e))
        traceback.print_exc()
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@permission_classes([HasSSOPermission('production')])
def adjustment_detail(request, pk):
    try:
        adjustment = StockAdjustment.objects.get(pk=pk)
    except StockAdjustment.DoesNotExist:
        return Response({'error': 'Data not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        if request.method == 'GET':
            serializer = StockAdjustmentSerializer(adjustment, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'DELETE':
            # Kembalikan stok sebelum delete (reverse operation)
            with transaction.atomic():
                product = adjustment.product
                
                # Reverse logic
                if adjustment.adjustment_type == 'addition':
                    product.current_stock -= adjustment.quantity  # Balik pengurangan
                else:  # reduction
                    product.current_stock += adjustment.quantity  # Balik penambahan
                
                product.save()
                adjustment.delete()
                
                return Response(
                    {'message': 'Adjustment deleted, stock restored'}, 
                    status=status.HTTP_204_NO_CONTENT
                )
            
    except Exception as e:
        print("ERROR DETAIL ADJUSTMENT:", str(e))
        traceback.print_exc()
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)