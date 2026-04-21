from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Sum
from decimal import Decimal, InvalidOperation
from datetime import datetime
from .models import ProfitDistribution, ProfitDistributionItem
from .serializers import ProfitDistributionSerializer
from asset.models import Asset
from funding.models import Funding
from dashboard.models import SystemConfig
from authentication.permissions import HasSSOPermission

# ==========================================
# 1. LIST & CREATE (GET, POST)
# ==========================================
@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('profit_distribution')])
def list_create_distributions(request):
    if request.method == 'GET':
        queryset = ProfitDistribution.objects.prefetch_related('items').all().order_by('-date')
        serializer = ProfitDistributionSerializer(queryset, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':

        data = request.data
        
        # Validate the total amount
        raw_amount = data.get('total_distributed') or data.get('total_amount') or 0
        try:
            total_amount = Decimal(str(raw_amount))
        except:
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)
        
        if total_amount <= 0:
            return Response({"detail": "Amount must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate the distribution date
        date_str = data.get('date')
        try:
            distribution_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            distribution_date = datetime.now().date()

        try:
            with transaction.atomic():
                # 1. Create the distribution header
                distribution = ProfitDistribution.objects.create(
                    total_distributed=total_amount,
                    notes=data.get('notes', 'Profit Distribution'),
                    date=distribution_date
                )

                # Load the default share configuration
                config, _ = SystemConfig.objects.get_or_create(id=1)
                SHARE_PRICE = Decimal(str(config.share_price or 100000))
                TOTAL_SYSTEM_SHARES = Decimal(str(config.total_system_shares or 15000))

                items = []
                
                # --- A. LANDOWNER ALLOCATION ---
                active_assets = Asset.objects.all()
                total_landowner_cut = Decimal('0')
                
                for asset in active_assets:
                    pct = Decimal(str(asset.landowner_share_percentage or 0))
                    if pct > 0:
                        cut = (total_amount * pct) / Decimal('100')
                        total_landowner_cut += cut
                        
                        items.append(ProfitDistributionItem(
                            distribution=distribution,
                            amount=cut,
                            role='Landowner',
                            description=f"Land fee: {asset.name} ({pct}%)"
                        ))

                # --- B. INVESTOR ALLOCATION ---
                net_for_investors = total_amount - total_landowner_cut
                
                # Calculate the dividend per share
                dividend_per_share = Decimal('0')
                if TOTAL_SYSTEM_SHARES > 0:
                    dividend_per_share = net_for_investors / TOTAL_SYSTEM_SHARES

                # Load investor funding rows
                investor_fundings = Funding.objects.filter(source_type='investor')
                
                for funding in investor_fundings:
                    # Derive share units from the row, or fall back to amount/share price
                    shares = Decimal(str(getattr(funding, 'shares', 0) or 0))
                    
                    if shares <= 0:
                        # Fallback: estimate share units from amount / share price
                        f_amount = Decimal(str(funding.amount or 0))
                        if f_amount > 0 and SHARE_PRICE > 0:
                            shares = f_amount / SHARE_PRICE
                    
                    if shares > 0:
                        investor_share = shares * dividend_per_share
                        
                        # Do not create zero-amount payout rows
                        if investor_share > 0:
                            items.append(ProfitDistributionItem(
                                distribution=distribution,
                                investor=None, # Funding currently has no direct user relation in this model
                                funding_source=funding,
                                amount=investor_share,
                                role='Investor',
                                description=f"{funding.source_name} - {shares:,.0f} shares"
                            ))
                
                # Persist distribution items (these reduce global cash on hand)
                if items:
                    ProfitDistributionItem.objects.bulk_create(items)
                else:
                    # Fail loudly if no payout items are generated so the admin can inspect the data
                    raise Exception("No recipients were generated. Check shares and landowner configuration.")

                serializer = ProfitDistributionSerializer(distribution)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            print(f"ERROR: {e}")
            return Response({"detail": f"Failed to process distribution: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# 2. PREVIEW (POST)
# ==========================================
@api_view(['POST'])
@permission_classes([HasSSOPermission('profit_distribution')])
def preview_distribution(request):
    try:
        raw_amount = request.data.get('total_distributed') or request.data.get('total_amount') or 0
        total_amount = Decimal(str(raw_amount))
        
        if total_amount <= 0:
            return Response({"detail": "Amount must be greater than 0"}, status=400)

        # Load configuration
        config, _ = SystemConfig.objects.get_or_create(id=1)
        SHARE_PRICE = Decimal(str(config.share_price or 100000))
        TOTAL_SYSTEM_SHARES = Decimal(str(config.total_system_shares or 15000))

        # 1. Landowner portion
        active_assets = Asset.objects.all()
        total_landowner_cut = Decimal('0')
        for asset in active_assets:
            pct = Decimal(str(asset.landowner_share_percentage or 0))
            if pct > 0:
                total_landowner_cut += (total_amount * pct) / Decimal('100')

        # 2. Investor portion
        net_for_investors = total_amount - total_landowner_cut
        dividend_per_share = net_for_investors / TOTAL_SYSTEM_SHARES if TOTAL_SYSTEM_SHARES > 0 else 0

        investor_fundings = Funding.objects.filter(source_type='investor')
        investor_rows = []
        total_payout_investors = Decimal('0')

        for f in investor_fundings:
            shares = Decimal(str(getattr(f, 'shares', 0) or 0))
            if shares <= 0:
                 f_amount = Decimal(str(f.amount or 0))
                 if f_amount > 0: shares = f_amount / SHARE_PRICE
            
            if shares > 0:
                payout = shares * dividend_per_share
                total_payout_investors += payout
                investor_rows.append({
                    "name": f.source_name,
                    "role": "Investor",
                    "portion_info": f"{shares:,.0f} shares",
                    "amount": float(payout)
                })

        retained = net_for_investors - total_payout_investors

        return Response({
            "summary": {
                "total_input": float(total_amount),
                "landowner_total": float(total_landowner_cut),
                "investor_net_pool": float(net_for_investors),
                "dividend_per_share": float(dividend_per_share),
                "retained_earnings": float(retained),
            },
            "investor_breakdown": investor_rows
        })

    except Exception as e:
        return Response({"detail": str(e)}, status=400)

# ==========================================
# 3. DETAIL & DELETE
# ==========================================
@api_view(['GET', 'DELETE'])
@permission_classes([HasSSOPermission('profit_distribution')])
def distribution_detail(request, pk):
    try:
        dist = ProfitDistribution.objects.prefetch_related('items').get(pk=pk)
    except ProfitDistribution.DoesNotExist:
        return Response(status=404)

    if request.method == 'GET':
        serializer = ProfitDistributionSerializer(dist)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        dist.delete()
        return Response(status=204)