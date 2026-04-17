"""
SEED DEMO DATA - LAHAN PINTAR (FINAL MASTER VERSION)
Automatically populate database with realistic demo data for presentation.
Run: python seed_demo_data.py
"""

import os
import django
from datetime import date
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_land.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import models as django_models
from authentication.models import Role
from investor.models import Investor
from asset.models import Asset, Owner
from funding_source.models import FundingSource
from project.models import Project
from funding.models import Funding
from ownership.models import Ownership
from expense.models import Expense
from production.models import Production

User = get_user_model()


def clear_data():
    """Clear existing data before seeding"""
    print("\n⚠️  WARNING: This will delete ALL existing data!")
    # confirm = input("Type 'YES' to continue: ")
    # if confirm != 'YES':
    #     print("❌ Seed cancelled.")
    #     return False
    
    print("🗑️  Clearing existing data...")
    # Order matters due to foreign keys
    try:
        Production.objects.all().delete()
        Expense.objects.all().delete()
        Ownership.objects.all().delete()
        Funding.objects.all().delete()
        Project.objects.all().delete()
        Asset.objects.all().delete()
        Owner.objects.all().delete()
        FundingSource.objects.all().delete()
        Investor.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        print("✅ Data cleared.\n")
        return True
    except Exception as e:
        print(f"⚠️  Error clearing data (might be empty): {e}")
        return True


def create_roles():
    """Create system roles"""
    print("📋 Creating Roles...")
    roles_data = [
        ('Superadmin', 'Full system access'),
        ('Admin', 'Administrative access'),
        ('Operator', 'Operational data entry'),
        ('Investor', 'Investor portal access'),
        ('Viewer', 'Read-only access'),
    ]
    
    roles = {}
    for name, desc in roles_data:
        role, created = Role.objects.get_or_create(
            name=name,
            defaults={'description': desc}
        )
        roles[name] = role
        status = "✅ Created" if created else "ℹ️  Exists"
        print(f"  {status}: {name}")
    
    return roles


def create_users(roles):
    """Create demo users"""
    print("\n👤 Creating Users...")
    
    users_data = [
        {
            'username': 'admin',
            'password': 'admin',
            'email': 'admin@lahanhijau.com',
            'role': None,
            'is_superuser': True,
            'is_staff': True,
        },
        {
            'username': 'rina_admin',
            'password': 'rina123',
            'email': 'rina@lahanhijau.com',
            'first_name': 'Rina',
            'last_name': 'Kusuma',
            'role': roles['Admin'],
        },
        {
            'username': 'budi_operator',
            'password': 'budi123',
            'email': 'budi@lahanhijau.com',
            'first_name': 'Budi',
            'last_name': 'Santoso',
            'role': roles['Operator'],
        },
        {
            'username': 'pt_agro_makmur',
            'password': 'investor123',
            'email': 'investment@agromakmur.co.id',
            'first_name': 'PT Agro',
            'last_name': 'Makmur',
            'role': roles['Investor'],
        },
        {
            'username': 'dewi_investor',
            'password': 'dewi123',
            'email': 'dewi.saputri@gmail.com',
            'first_name': 'Dewi',
            'last_name': 'Saputri',
            'role': roles['Investor'],
        },
        {
            'username': 'yayasan_tani_maju',
            'password': 'yayasan123',
            'email': 'info@yayanitanimaju.org',
            'first_name': 'Yayasan',
            'last_name': 'Tani Maju',
            'role': roles['Investor'],
        },
        {
            'username': 'andi_viewer',
            'password': 'andi123',
            'email': 'andi.kusuma@gmail.com',
            'first_name': 'Andi',
            'last_name': 'Kusuma',
            'role': roles['Viewer'],
        },
    ]
    
    users = {}
    for user_data in users_data:
        username = user_data['username']
        
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            print(f"  ℹ️  Exists: {username}")
        else:
            password = user_data.pop('password')
            if user_data.get('is_superuser'):
                user = User.objects.create_superuser(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=password
                )
            else:
                user = User.objects.create_user(
                    password=password,
                    **user_data
                )
            print(f"  ✅ Created: {username} (password: {password})")
        
        users[username] = user
    
    return users


def create_owners():
    """Create landowners"""
    print("\n🏡 Creating Landowners...")
    
    owners_data = [
        {
            'nama': 'Pak Joko Santoso',
            'kontak': '081234567800',
            'alamat': 'Desa Ciapus, Bogor, Jawa Barat',
            'bank': 'BCA',
            'nomor_rekening': '1234567890',
        },
        {
            'nama': 'Bu Siti Aminah',
            'kontak': '081234567801',
            'alamat': 'Desa Sukamaju, Cianjur, Jawa Barat',
            'bank': 'Mandiri',
            'nomor_rekening': '9876543210',
        },
        {
            'nama': 'Pak Ahmad Hidayat',
            'kontak': '081234567802',
            'alamat': 'Desa Pasir Mukti, Sukabumi, Jawa Barat',
            'bank': 'BRI',
            'nomor_rekening': '5555666677',
        },
    ]
    
    owners = {}
    for data in owners_data:
        owner, created = Owner.objects.get_or_create(
            nama=data['nama'],
            defaults=data
        )
        owners[data['nama']] = owner
        status = "✅ Created" if created else "ℹ️  Exists"
        print(f"  {status}: {data['nama']}")
    
    return owners


def create_assets(owners):
    """Create assets (Corrected Greenhouse logic)"""
    print("\n🏞️  Creating Assets...")
    
    assets_data = [
        {
            'name': 'Lahan Cabai Bogor - Blok A',
            'type': 'lahan',
            'location': 'Desa Ciapus, Bogor, Jawa Barat',
            'size': 5000,
            'value': Decimal('250000000'),
            'acquisition_date': date(2024, 1, 15),
            'ownership_status': 'partial_ownership',
            'landowner': owners['Pak Joko Santoso'],
            'landowner_share_percentage': Decimal('15.00'), # Ada pemilik = Ada jatah 15%
            'document_url': 'https://drive.google.com/file/sertifikat-bogor-a',
        },
        {
            'name': 'Lahan Cabai Cianjur - Blok B',
            'type': 'lahan',
            'location': 'Desa Sukamaju, Cianjur, Jawa Barat',
            'size': 8000,
            'value': Decimal('400000000'),
            'acquisition_date': date(2024, 2, 1),
            'ownership_status': 'investor_owned',
            'landowner': owners['Bu Siti Aminah'],
            'landowner_share_percentage': Decimal('12.00'),
            'document_url': 'https://drive.google.com/file/sertifikat-cianjur-b',
        },
        {
            'name': 'Lahan Cabai Sukabumi - Blok C',
            'type': 'lahan',
            'location': 'Desa Pasir Mukti, Sukabumi, Jawa Barat',
            'size': 3000,
            'value': Decimal('180000000'),
            'acquisition_date': date(2024, 3, 10),
            'ownership_status': 'under_construction',
            'landowner': owners['Pak Ahmad Hidayat'],
            'landowner_share_percentage': Decimal('10.00'),
            'document_url': 'https://drive.google.com/file/sertifikat-sukabumi-c',
        },
        {
            'name': 'Greenhouse Sistem Irigasi Otomatis',
            'type': 'bangunan',
            'location': 'Desa Ciapus, Bogor (Area Lahan A)',
            'size': 500,
            'value': Decimal('75000000'),
            'acquisition_date': date(2024, 1, 20),
            'ownership_status': 'full_ownership',
            'landowner': None, # MILIK PERUSAHAAN SENDIRI
            'landowner_share_percentage': Decimal('0.00'), # Jatah pemilik 0%
            'document_url': 'https://drive.google.com/file/imb-greenhouse',
        },
        {
            'name': 'Traktor Kubota + Alat Pengolah Tanah',
            'type': 'alat',
            'location': 'Gudang Pusat, Bogor',
            'size': 1,
            'value': Decimal('125000000'),
            'acquisition_date': date(2024, 1, 25),
            'ownership_status': 'full_ownership',
            'landowner': None, 
            'landowner_share_percentage': Decimal('0.00'), # Jatah pemilik 0%
            'document_url': 'https://drive.google.com/file/invoice-traktor',
        },
        {
            'name': 'Kambing Etawa (20 ekor)',
            'type': 'ternak',
            'location': 'Kandang Desa Ciapus, Bogor',
            'size': 20,
            'value': Decimal('60000000'),
            'acquisition_date': date(2024, 2, 15),
            'ownership_status': 'personal_ownership',
            'landowner': owners['Pak Joko Santoso'],
            'landowner_share_percentage': Decimal('20.00'),
            'document_url': 'https://drive.google.com/file/surat-jual-beli-kambing',
        },
    ]
    
    assets = {}
    for data in assets_data:
        asset, created = Asset.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        assets[data['name']] = asset
        status = "✅ Created" if created else "ℹ️  Exists"
        print(f"  {status}: {data['name']}")
    
    return assets


def create_investors(users):
    """Create investor profiles"""
    print("\n💼 Creating Investor Profiles...")
    
    investors_data = [
        {
            'user': users['pt_agro_makmur'],
            'contact': 'investment@agromakmur.co.id | 021-5566778',
            'join_date': date(2024, 1, 10),
            'total_investment': Decimal('0'), # Auto-calculated later
        },
        {
            'user': users['dewi_investor'],
            'contact': 'dewi.saputri@gmail.com | 081298765432',
            'join_date': date(2024, 1, 12),
            'total_investment': Decimal('0'),
        },
        {
            'user': users['yayasan_tani_maju'],
            'contact': 'info@yayanitanimaju.org | 021-7788990',
            'join_date': date(2024, 2, 5),
            'total_investment': Decimal('0'),
        },
    ]
    
    investors = {}
    for data in investors_data:
        investor, created = Investor.objects.get_or_create(
            user=data['user'],
            defaults=data
        )
        investors[data['user'].username] = investor
        status = "✅ Created" if created else "ℹ️  Exists"
        print(f"  {status}: {data['user'].username}")
    
    return investors


def create_funding_sources():
    """Create funding sources"""
    print("\n💰 Creating Funding Sources...")
    
    sources_data = [
        {
            'name': 'PT Agro Makmur',
            'type': 'investor',
            'contact_info': 'Gedung Permata, Jl. Sudirman Kav. 52 | 021-5566778 | pic.investment@agromakmur.co.id',
        },
        {
            'name': 'Dewi Saputri',
            'type': 'investor',
            'contact_info': 'Jl. Melati 78, Tangerang | 081298765432 | dewi.saputri@gmail.com',
        },
        {
            'name': 'Yayasan Tani Maju',
            'type': 'foundation',
            'contact_info': 'Jl. Kebon Jeruk 23, Jakarta | 021-7788990 | finance@yayanitanimaju.org',
        },
        {
            'name': 'CSR Bank Mandiri',
            'type': 'csr',
            'contact_info': 'Divisi CSR Bank Mandiri | 021-5299-5299 | csr@bankmandiri.co.id',
        },
    ]
    
    sources = {}
    for data in sources_data:
        source, created = FundingSource.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        sources[data['name']] = source
        status = "✅ Created" if created else "ℹ️  Exists"
        print(f"  {status}: {data['name']}")
    
    return sources


def create_projects(assets):
    """Create projects"""
    print("\n📁 Creating Projects...")
    
    projects_data = [
        {
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'name': 'Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024',
            'description': 'Penanaman cabai rawit merah varietas unggul dengan target 3 ton/bulan. Menggunakan sistem irigasi tetes dan pupuk organik.',
            'start_date': date(2024, 1, 20),
            'end_date': date(2024, 4, 30),
            'budget': Decimal('150000000'),
            'status': 'Completed',
        },
        {
            'asset': assets['Lahan Cabai Cianjur - Blok B'],
            'name': 'Budidaya Cabai Keriting - Periode Feb-Mei 2024',
            'description': 'Penanaman cabai keriting dengan teknologi greenhouse parsial. Target panen 5 ton selama periode tanam.',
            'start_date': date(2024, 2, 5),
            'end_date': date(2024, 5, 31),
            'budget': Decimal('250000000'),
            'status': 'In Progress',
        },
        {
            'asset': assets['Greenhouse Sistem Irigasi Otomatis'],
            'name': 'Konstruksi Greenhouse + Instalasi IoT Sensor',
            'description': 'Pembangunan greenhouse modern dengan sensor suhu, kelembaban, dan sistem irigasi otomatis berbasis IoT.',
            'start_date': date(2024, 1, 15),
            'end_date': date(2024, 2, 28),
            'budget': Decimal('100000000'),
            'status': 'Completed',
        },
        {
            'asset': assets['Lahan Cabai Sukabumi - Blok C'],
            'name': 'Land Clearing & Soil Preparation - Sukabumi',
            'description': 'Pembersihan lahan, penggemburan tanah, pembuatan bedengan, dan instalasi sistem drainase.',
            'start_date': date(2024, 3, 15),
            'end_date': date(2024, 4, 15),
            'budget': Decimal('80000000'),
            'status': 'In Progress',
        },
    ]
    
    projects = {}
    for data in projects_data:
        project, created = Project.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        projects[data['name']] = project
        status = "✅ Created" if created else "ℹ️  Exists"
        print(f"  {status}: {data['name'][:50]}...")
    
    return projects


def create_fundings(sources, projects):
    """Create funding records - SKENARIO FINAL (Cianjur Habis & Pool)"""
    print("\n💵 Creating Funding Records...")
    
    fundings_data = [
        # 1. PT Agro - Modal Awal Bogor (50 Juta) - PAS
        {
            'source': sources['PT Agro Makmur'],
            'project': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'amount': Decimal('50000000'),
            'date_received': date(2024, 1, 12),
            'purpose': 'Modal awal (Bibit & Gaji)',
            'status': 'used',
        },
        # 2. Dewi - Modal Tambahan Bogor (100 Juta) - PAS
        {
            'source': sources['Dewi Saputri'],
            'project': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'amount': Decimal('100000000'),
            'date_received': date(2024, 1, 15),
            'purpose': 'Investasi tambahan (Pupuk & Irigasi)',
            'status': 'used',
        },
        # 3. CSR - Greenhouse (100 Juta) - PAS
        {
            'source': sources['CSR Bank Mandiri'],
            'project': projects['Konstruksi Greenhouse + Instalasi IoT Sensor'],
            'amount': Decimal('100000000'),
            'date_received': date(2024, 1, 10),
            'purpose': 'Hibah CSR pembangunan infrastruktur',
            'status': 'allocated',
        },
        # 4. Yayasan - Cianjur (200 Juta) - HABIS/USED
        {
            'source': sources['Yayasan Tani Maju'],
            'project': projects['Budidaya Cabai Keriting - Periode Feb-Mei 2024'],
            'amount': Decimal('200000000'),
            'date_received': date(2024, 2, 1),
            'purpose': 'Pendanaan proyek Cianjur Tahap 1',
            'status': 'used', # HABIS/USED agar skenario pakai dana pool logis
        },
        # 5. PT Agro - Sukabumi (80 Juta) - SISA
        {
            'source': sources['PT Agro Makmur'],
            'project': projects['Land Clearing & Soil Preparation - Sukabumi'],
            'amount': Decimal('80000000'),
            'date_received': date(2024, 3, 12),
            'purpose': 'Biaya land clearing Sukabumi',
            'status': 'allocated',
        },
        # 6. Dewi - Dana Pool (50 Juta) - AVAILABLE
        {
            'source': sources['Dewi Saputri'],
            'project': None, # Available / Pool
            'amount': Decimal('50000000'),
            'date_received': date(2024, 3, 20),
            'purpose': 'Dana cadangan (Pool Fund)',
            'status': 'available',
        },
    ]
    
    fundings = []
    for data in fundings_data:
        existing = Funding.objects.filter(
            source=data['source'],
            amount=data['amount'],
            date_received=data['date_received']
        ).first()
        
        if existing:
            funding = existing
            print(f"  ℹ️  Exists: Funding #{existing.id}")
        else:
            funding = Funding.objects.create(**data)
            print(f"  ✅ Created: Funding #{funding.id} - {data['source'].name} (Rp {data['amount']:,})")
        
        fundings.append(funding)
    
    return fundings


def create_ownerships(investors, assets, fundings):
    """Create ownership records with ACTIVE status"""
    print("\n📊 Creating Ownership Records...")
    
    ownerships_data = [
        {
            'investor': investors['pt_agro_makmur'],
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'funding': fundings[0],
            'units': 600,
            'investment_date': date(2024, 1, 12),
            'status': 'Active', # [PENTING] Set status Active explisit
        },
        {
            'investor': investors['dewi_investor'],
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'funding': fundings[1],
            'units': 400,
            'investment_date': date(2024, 1, 15),
            'status': 'Active',
        },
        {
            'investor': investors['yayasan_tani_maju'],
            'asset': assets['Lahan Cabai Cianjur - Blok B'],
            'funding': fundings[3],
            'units': 1000,
            'investment_date': date(2024, 2, 1),
            'status': 'Active',
        },
        {
            'investor': investors['pt_agro_makmur'],
            'asset': assets['Lahan Cabai Sukabumi - Blok C'],
            'funding': fundings[4],
            'units': 800,
            'investment_date': date(2024, 3, 12),
            'status': 'Active',
        },
        {
            'investor': investors['dewi_investor'],
            'asset': None,
            'funding': fundings[5],
            'units': 500,
            'investment_date': date(2024, 3, 20),
            'status': 'Active',
        },
    ]
    
    ownerships = []
    for data in ownerships_data:
        existing = Ownership.objects.filter(
            investor=data['investor'],
            funding=data['funding']
        ).first()
        
        if existing:
            ownership = existing
            asset_name = existing.asset.name if existing.asset else "Dana Mengendap"
            print(f"  ℹ️  Exists: {existing.investor.user.username} → {asset_name}")
        else:
            ownership = Ownership.objects.create(**data)
            
            # Calculate ownership percentage
            if ownership.asset:
                total_units = Ownership.objects.filter(asset=ownership.asset).aggregate(
                    total=django_models.Sum('units')
                )['total'] or 1
                
                for o in Ownership.objects.filter(asset=ownership.asset):
                    o.ownership_percentage = round((o.units / total_units) * 100, 2)
                    o.save(update_fields=['ownership_percentage'])
            
            asset_name = ownership.asset.name if ownership.asset else "Dana Mengendap (Cash)"
            print(f"  ✅ Created: {ownership.investor.user.username} → {asset_name} ({ownership.units} units) [Status: {ownership.status}]")
        
        ownerships.append(ownership)
    
    return ownerships


def create_expenses(projects, fundings):
    """Create expense records - CIANJUR DANA HABIS"""
    print("\n💸 Creating Expense Records...")
    
    expenses_data = [
        # --- PROYEK BOGOR (50jt + 100jt = 150jt Pas) ---
        {
            'category': 'Pembelian',
            'amount': Decimal('15000000'),
            'date': date(2024, 1, 22),
            'description': 'Pembelian bibit cabai rawit merah varietas unggul 10.000 batang @ Rp 1.500',
            'proof_url': 'https://drive.google.com/invoice-bibit-bogor',
            'project_id': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'funding_id': fundings[0],
        },
        {
            'category': 'Operasional',
            'amount': Decimal('8000000'),
            'date': date(2024, 1, 25),
            'description': 'Gaji 4 orang tenaga tanam untuk bulan Januari (@ Rp 2jt/orang)',
            'proof_url': 'https://drive.google.com/slip-gaji-jan',
            'project_id': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'funding_id': fundings[0],
        },
        {
            'category': 'Pembelian',
            'amount': Decimal('12000000'),
            'date': date(2024, 2, 1),
            'description': 'Pupuk organik NPK 2 ton + pestisida nabati',
            'proof_url': 'https://drive.google.com/invoice-pupuk-bogor',
            'project_id': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'funding_id': fundings[1],
        },
        {
            'category': 'Operasional',
            'amount': Decimal('5000000'),
            'date': date(2024, 2, 10),
            'description': 'Biaya irigasi (listrik pompa air + maintenance sistem tetes)',
            'proof_url': 'https://drive.google.com/tagihan-listrik-feb',
            'project_id': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'funding_id': fundings[1],
        },
        {
            'category': 'Operasional',
            'amount': Decimal('10000000'),
            'date': date(2024, 3, 5),
            'description': 'Biaya panen (tenaga panen + sortir + packaging)',
            'proof_url': 'https://drive.google.com/payroll-panen-mar',
            'project_id': projects['Budidaya Cabai Rawit Merah - Periode Jan-Apr 2024'],
            'funding_id': fundings[0],
        },
        # --- PROYEK GREENHOUSE (100jt Pas) ---
        {
            'category': 'Proyek',
            'amount': Decimal('45000000'),
            'date': date(2024, 1, 18),
            'description': 'Konstruksi rangka baja greenhouse ukuran 500 m² (bahan + tukang)',
            'proof_url': 'https://drive.google.com/invoice-konstruksi-gh',
            'project_id': projects['Konstruksi Greenhouse + Instalasi IoT Sensor'],
            'funding_id': fundings[2],
        },
        {
            'category': 'Pembelian',
            'amount': Decimal('25000000'),
            'date': date(2024, 1, 28),
            'description': 'Plastik UV greenhouse + sistem ventilasi',
            'proof_url': 'https://drive.google.com/invoice-plastik-uv',
            'project_id': projects['Konstruksi Greenhouse + Instalasi IoT Sensor'],
            'funding_id': fundings[2],
        },
        {
            'category': 'Pembelian',
            'amount': Decimal('30000000'),
            'date': date(2024, 2, 15),
            'description': 'IoT sensor kit (suhu, kelembaban, pH tanah) + controller otomatis',
            'proof_url': 'https://drive.google.com/invoice-iot-sensor',
            'project_id': projects['Konstruksi Greenhouse + Instalasi IoT Sensor'],
            'funding_id': fundings[2],
        },
        # --- PROYEK CIANJUR (200 Juta HABIS TOTAL) ---
        {
            'category': 'Pembelian',
            'amount': Decimal('20000000'),
            'date': date(2024, 2, 8),
            'description': 'Bibit cabai keriting 15.000 batang + media tanam',
            'proof_url': 'https://drive.google.com/invoice-bibit-cianjur',
            'project_id': projects['Budidaya Cabai Keriting - Periode Feb-Mei 2024'],
            'funding_id': fundings[3],
        },
        {
            'category': 'Operasional',
            'amount': Decimal('12000000'),
            'date': date(2024, 2, 20),
            'description': 'Gaji tenaga kerja Februari (6 orang @ Rp 2jt)',
            'proof_url': 'https://drive.google.com/payroll-feb-cianjur',
            'project_id': projects['Budidaya Cabai Keriting - Periode Feb-Mei 2024'],
            'funding_id': fundings[3],
        },
        # [PENTING] Expense besar untuk menghabiskan sisa dana (168jt)
        {
            'category': 'Proyek',
            'amount': Decimal('168000000'), # 200 - 20 - 12 = 168
            'date': date(2024, 2, 25),
            'description': 'Pembangunan Infrastruktur Irigasi & Gudang Penyimpanan',
            'proof_url': 'https://drive.google.com/invoice-infra-cianjur',
            'project_id': projects['Budidaya Cabai Keriting - Periode Feb-Mei 2024'],
            'funding_id': fundings[3],
        },
        # --- PROYEK SUKABUMI (Sebagian) ---
        {
            'category': 'Proyek',
            'amount': Decimal('35000000'),
            'date': date(2024, 3, 18),
            'description': 'Land clearing 3000 m² (excavator + tenaga kerja 2 minggu)',
            'proof_url': 'https://drive.google.com/invoice-clearing-sukabumi',
            'project_id': projects['Land Clearing & Soil Preparation - Sukabumi'],
            'funding_id': fundings[4],
        },
        {
            'category': 'Pembelian',
            'amount': Decimal('18000000'),
            'date': date(2024, 3, 28),
            'description': 'Pupuk kandang 5 ton + kapurpertanian untuk pengolahan tanah',
            'proof_url': 'https://drive.google.com/invoice-pupuk-sukabumi',
            'project_id': projects['Land Clearing & Soil Preparation - Sukabumi'],
            'funding_id': fundings[4],
        },
    ]
    
    expenses = []
    for data in expenses_data:
        existing = Expense.objects.filter(
            project_id=data['project_id'],
            amount=data['amount'],
            date=data['date']
        ).first()
        
        if existing:
            expense = existing
            print(f"  ℹ️  Exists: {existing.description[:50]}...")
        else:
            expense = Expense.objects.create(**data)
            print(f"  ✅ Created: {expense.description[:50]}... (Rp {expense.amount:,})")
        
        expenses.append(expense)
    
    return expenses


def create_productions(assets):
    """Create production records"""
    print("\n🌾 Creating Production Records...")
    
    productions_data = [
        # Panen Bogor
        {
            'name': 'Panen Cabai Rawit Merah - Batch 1',
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'date': date(2024, 3, 15),
            'quantity': 1200,
            'unit': 'kilogram',
            'unit_price': Decimal('45000'),
            'status': 'terjual',
        },
        {
            'name': 'Panen Cabai Rawit Merah - Batch 2',
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'date': date(2024, 3, 28),
            'quantity': 1500,
            'unit': 'kilogram',
            'unit_price': Decimal('48000'),
            'status': 'terjual',
        },
        {
            'name': 'Panen Cabai Rawit Merah - Batch 3',
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'date': date(2024, 4, 10),
            'quantity': 1800,
            'unit': 'kilogram',
            'unit_price': Decimal('50000'),
            'status': 'stok',
        },
        {
            'name': 'Panen Cabai Rawit Merah - Batch 4 (Final)',
            'asset': assets['Lahan Cabai Bogor - Blok A'],
            'date': date(2024, 4, 25),
            'quantity': 1600,
            'unit': 'kilogram',
            'unit_price': Decimal('47000'),
            'status': 'stok',
        },
        # Panen Cianjur
        {
            'name': 'Panen Cabai Keriting - Batch 1',
            'asset': assets['Lahan Cabai Cianjur - Blok B'],
            'date': date(2024, 3, 20),
            'quantity': 2000,
            'unit': 'kilogram',
            'unit_price': Decimal('42000'),
            'status': 'terjual',
        },
        {
            'name': 'Panen Cabai Keriting - Batch 2',
            'asset': assets['Lahan Cabai Cianjur - Blok B'],
            'date': date(2024, 4, 5),
            'quantity': 2200,
            'unit': 'kilogram',
            'unit_price': Decimal('44000'),
            'status': 'stok',
        },
        # Hasil Ternak
        {
            'name': 'Penjualan Susu Kambing Etawa - Maret 2024',
            'asset': assets['Kambing Etawa (20 ekor)'],
            'date': date(2024, 3, 31),
            'quantity': 450,
            'unit': 'liter',
            'unit_price': Decimal('35000'),
            'status': 'terjual',
        },
    ]
    
    productions = []
    for data in productions_data:
        total_value = Decimal(str(data['quantity'])) * data['unit_price']
        
        existing = Production.objects.filter(
            asset=data['asset'],
            date=data['date'],
            quantity=data['quantity']
        ).first()
        
        if existing:
            production = existing
            print(f"  ℹ️  Exists: {existing.name}")
        else:
            production = Production.objects.create(
                **data,
                total_value=total_value
            )
            print(f"  ✅ Created: {production.name} (Rp {total_value:,})")
            print(f"     💡 Note: Profit distribution akan di-generate otomatis saat input via web")
        
        productions.append(production)
    
    return productions


def print_summary():
    """Print summary statistics"""
    print("\n" + "="*70)
    print("📊 DATABASE SUMMARY")
    print("="*70)
    
    print(f"\n👤 Users: {User.objects.count()}")
    print(f"   ├─ Superadmin: {User.objects.filter(is_superuser=True).count()}")
    print(f"   ├─ Admin: {User.objects.filter(role__name='Admin').count()}")
    print(f"   ├─ Operator: {User.objects.filter(role__name='Operator').count()}")
    print(f"   ├─ Investor: {User.objects.filter(role__name='Investor').count()}")
    print(f"   └─ Viewer: {User.objects.filter(role__name='Viewer').count()}")
    
    print(f"\n🏡 Landowners: {Owner.objects.count()}")
    print(f"🏞️  Assets: {Asset.objects.count()}")
    print(f"💼 Investors: {Investor.objects.count()}")
    print(f"💰 Funding Sources: {FundingSource.objects.count()}")
    print(f"📁 Projects: {Project.objects.count()}")
    print(f"💵 Fundings: {Funding.objects.count()}")
    
    total_funding = Funding.objects.aggregate(
        total=django_models.Sum('amount')
    )['total'] or 0
    print(f"   └─ Total: Rp {total_funding:,}")
    
    print(f"\n📊 Ownerships: {Ownership.objects.count()}")
    print(f"💸 Expenses: {Expense.objects.count()}")
    
    total_expense = Expense.objects.aggregate(
        total=django_models.Sum('amount')
    )['total'] or 0
    print(f"   └─ Total: Rp {total_expense:,}")
    
    print(f"\n🌾 Productions: {Production.objects.count()}")
    
    total_production = Production.objects.aggregate(
        total=django_models.Sum('total_value')
    )['total'] or 0
    print(f"   └─ Total Value: Rp {total_production:,}")
    
    print(f"\n💡 Profit Distributions: {Production.objects.filter(profit_distributions__isnull=False).count()}")
    
    print("\n" + "="*70)
    print("✅ SEED COMPLETED SUCCESSFULLY!")
    print("="*70)
    
    print("\n📝 LOGIN CREDENTIALS:")
    print("   Superadmin: admin / admin")
    print("   Admin: rina_admin / rina123")
    print("   Operator: budi_operator / budi123")
    print("   Investor 1: pt_agro_makmur / investor123")
    print("   Investor 2: dewi_investor / dewi123")
    print("   Investor 3: yayasan_tani_maju / yayasan123")
    print("   Viewer: andi_viewer / andi123")
    
    print("\n🚀 Next Steps:")
    print("   1. python manage.py runserver")
    print("   2. Login as 'admin' to see all data")
    print("   3. Login as 'pt_agro_makmur' to see investor view")
    print()


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("🌱 LAHAN PINTAR - DEMO DATA SEEDER")
    print("="*70)
    
    try:
        # Create data in order
        if not clear_data():
            return
            
        roles = create_roles()
        users = create_users(roles)
        owners = create_owners()
        assets = create_assets(owners)
        investors = create_investors(users)
        sources = create_funding_sources()
        projects = create_projects(assets)
        fundings = create_fundings(sources, projects)
        ownerships = create_ownerships(investors, assets, fundings)
        expenses = create_expenses(projects, fundings)
        productions = create_productions(assets)
        
        # Print summary
        print_summary()
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\n💡 Tip: Make sure database is migrated: python manage.py migrate")


if __name__ == '__main__':
    main()