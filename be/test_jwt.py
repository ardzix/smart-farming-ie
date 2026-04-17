import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_land.settings')
django.setup()

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from authentication.models import CustomUser
import jwt

# Ambil user nano
try:
    user = CustomUser.objects.get(username='nano')
except CustomUser.DoesNotExist:
    print("❌ User 'nano' tidak ditemukan!")
    exit()

# Generate token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

print("\n" + "=" * 70)
print("JWT TOKEN DEBUG - Django Backend")
print("=" * 70)
print(f"User: {user.username} (ID: {user.id})")
print(f"Role: {user.role}")
print(f"\nSecret Key:")
print(f"  Full: {settings.SECRET_KEY}")
print(f"  First 20 chars: {settings.SECRET_KEY[:20]}...")
print(f"  Length: {len(settings.SECRET_KEY)}")

print(f"\nAccess Token:")
print(f"  First 50 chars: {access_token[:50]}...")
print(f"  Full length: {len(access_token)} characters")

# Decode tanpa verifikasi
decoded_header = jwt.get_unverified_header(access_token)
print(f"\nToken Header (algorithm):")
print(f"  {decoded_header}")

decoded_unverified = jwt.decode(access_token, options={"verify_signature": False})
print(f"\nToken Payload (unverified):")
for key, value in decoded_unverified.items():
    print(f"  {key}: {value}")

# Decode dengan verifikasi
print(f"\nVerifying token with SECRET_KEY...")
try:
    decoded = jwt.decode(
        access_token, 
        settings.SECRET_KEY, 
        algorithms=['HS256']
    )
    print("✅ Token verified successfully!")
    print(f"\nVerified Payload:")
    for key, value in decoded.items():
        print(f"  {key}: {value}")
except Exception as e:
    print(f"❌ Verification failed: {e}")

print("\n" + "=" * 70)
print("\n📋 Copy this secret key to .env.local:")
print(f"NEXT_PUBLIC_JWT_SECRET={settings.SECRET_KEY}")
print("=" * 70 + "\n")