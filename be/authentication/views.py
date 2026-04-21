import json
import os
import jwt as pyjwt
import requests
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer
from django.conf import settings
from .permissions import HasSSOPermission

# --- Helper functions ---
def set_auth_cookies(response, refresh_token):
    is_production = not settings.DEBUG
    access_token = refresh_token.access_token
    response.set_cookie(
        key='access_token',
        value=str(access_token),
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        httponly=True,
        secure=is_production,
        samesite='Lax'
    )
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        httponly=True,
        secure=is_production,
        samesite='Lax'
    )
    return response

def set_user_cookie(response, user_data):
    is_production = not settings.DEBUG
    cookie_value = json.dumps(user_data)
    response.set_cookie(
        key='user',
        value=cookie_value,
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        httponly=False,
        secure=is_production,
        samesite='Lax'
    )
    return response

# --- SSO JWT decoder ---

# Load the RSA public key from disk
_SSO_PUBLIC_KEY_PATH = os.getenv(
    'SSO_PUBLIC_KEY_PATH',
    os.path.join(os.path.dirname(__file__), 'keys', 'public.pem')
)
try:
    with open(_SSO_PUBLIC_KEY_PATH, 'r') as f:
        SSO_PUBLIC_KEY = f.read()
except FileNotFoundError:
    SSO_PUBLIC_KEY = None
    print("[WARNING] SSO public.pem not found. JWT decoding will fail.")


def decode_sso_jwt(sso_token, refresh_token):
    """
    Decode SSO JWT (RS256) untuk mengekstrak roles, permissions, is_owner, org_id, org_name.
    Strategi: Coba verified decode dulu, fallback ke unverified jika public key gagal.
    Token ini aman di-decode tanpa verifikasi karena kita terima langsung dari server SSO.
    """
    if not sso_token:
        return {}
    
    result = {}
    
    # Strategy 1: verified decode with the public key
    if SSO_PUBLIC_KEY:
        try:
            payload = pyjwt.decode(
                sso_token, 
                SSO_PUBLIC_KEY, 
                algorithms=['RS256'],
                options={'verify_exp': False}
            )
            result = payload
            print(f"[SSO JWT] ✅ Verified decode berhasil. Roles: {payload.get('roles')}, Permissions: {payload.get('permissions')}")
        except Exception as e:
            print(f"[SSO JWT] ⚠️ Verified decode gagal: {e}. Mencoba fallback...")
    
    # Strategi 2: Fallback — unverified decode (aman karena token dari server SSO langsung)
    if not result:
        try:
            payload = pyjwt.decode(
                sso_token, 
                options={
                    'verify_signature': False, 
                    'verify_exp': False
                },
                algorithms=['RS256']
            )
            result = payload
            print(f"[SSO JWT] ✅ Unverified decode berhasil. Roles: {payload.get('roles')}, Permissions: {payload.get('permissions')}")
        except Exception as e:
            print(f"[SSO JWT] ❌ Semua decode gagal: {e}")
            return {}
    
    return {
        'roles': result.get('roles', []),
        'permissions': result.get('permissions', []),
        'is_owner': result.get('is_owner', False),
        'org_id': result.get('org_id'),
        'org_name': result.get('org_name'),
        'access': sso_token,
        'refresh': refresh_token,
    }


def extract_primary_role_name(profile=None, sso_claims=None):
    if sso_claims:
        jwt_roles = sso_claims.get('roles', [])
        if jwt_roles:
            first_role = jwt_roles[0]
            return first_role if isinstance(first_role, str) else first_role.get('name')

    if profile:
        profile_role = profile.get('role')
        if isinstance(profile_role, dict):
            return profile_role.get('name')
        if profile_role:
            return str(profile_role)

    return None


def build_user_data(user, role_name=None, sso_claims=None):
    """Build the `user_data` payload enriched with SSO claims."""
    data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': role_name,
        'roles': [],
        'permissions': [],
        'is_owner': False,
        'org_id': None,
        'org_name': None,
    }
    if sso_claims:
        data['roles'] = sso_claims.get('roles', [])
        data['permissions'] = sso_claims.get('permissions', [])
        data['is_owner'] = sso_claims.get('is_owner', False)
        data['org_id'] = sso_claims.get('org_id')
        data['org_name'] = sso_claims.get('org_name')
        data['access'] = sso_claims.get('access')
        data['refresh'] = sso_claims.get('refresh')

        if not role_name:
            data['role'] = extract_primary_role_name(sso_claims=sso_claims)
    return data


# --- Auth views ---

def sync_user_from_sso_profile(profile, email):
    username = profile.get('username') or email.split('@')[0]

    # Synchronize the local user record
    user, created = CustomUser.objects.get_or_create(username=username, defaults={'email': email})
    if not created and user.email != email:
        user.email = email

    if profile.get('first_name'): user.first_name = profile.get('first_name')
    if profile.get('last_name'): user.last_name = profile.get('last_name')
    user.save()

    return user

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_sso(request):
    google_token = request.data.get('token')
    if not google_token:
        return Response({'error': 'Google token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 1. Exchange the Google token for an SSO token
    sso_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/google-login/"
    try:
        sso_resp = requests.post(sso_url, json={'token': google_token})
        if sso_resp.status_code not in [200, 201]:
            return Response({'error': 'Failed to authenticate with SSO', 'details': sso_resp.text}, status=sso_resp.status_code)
        
        sso_data = sso_resp.json()
        
        # Explicitly check whether MFA is required
        if sso_data.get('mfa_required') is True:
            return Response({
                'require_mfa': True,
                'mfa_required': True,
                'token': sso_data.get('token'),
                'pre_auth_token': sso_data.get('token'),
                'message': sso_data.get('message', 'MFA verification required')
            }, status=status.HTTP_200_OK)
            
        # Prefer 'access' or 'access_token' for the normal login flow
        sso_jwt = sso_data.get('access') or sso_data.get('access_token') or sso_data.get('token')
        refresh_jwt = sso_data.get('refresh') or sso_data.get('refresh_token')
        if not sso_jwt:
            return Response({'error': 'No SSO token returned', 'sso_response': sso_data}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 2. Decode the SSO JWT to extract roles and permissions
        sso_claims = decode_sso_jwt(sso_jwt, refresh_jwt)
        
        # 3. Fetch the user profile from SSO
        me_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/me/"
        headers = {'Authorization': f'Bearer {sso_jwt}'}
        me_resp = requests.get(me_url, headers=headers)
        if me_resp.status_code != 200:
            return Response({
                'error': 'Failed to fetch user profile from SSO',
                'sso_status': me_resp.status_code,
                'sso_error': me_resp.text,
                'sso_keys': list(sso_data.keys())
            }, status=me_resp.status_code)
            
        profile = me_resp.json()
        email = profile.get('email', '')
        user = sync_user_from_sso_profile(profile, email)
        
        # 4. Generate the local session JWT
        refresh = RefreshToken.for_user(user)
        user_data = build_user_data(user, extract_primary_role_name(profile, sso_claims), sso_claims)
        
        # Store SSO claims in the Django session for HasSSOPermission
        request.session['sso_roles'] = sso_claims.get('roles', [])
        request.session['sso_permissions'] = sso_claims.get('permissions', [])
        request.session['sso_is_owner'] = sso_claims.get('is_owner', False)
        request.session['sso_org_id'] = sso_claims.get('org_id')
        request.session['sso_org_name'] = sso_claims.get('org_name')
        request.session['sso_access_token'] = sso_jwt
        
        response = Response({'user': user_data})
        set_auth_cookies(response, refresh)
        set_user_cookie(response, user_data)
        return response
        
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    sso_login_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/login/"
    try:
        sso_resp = requests.post(sso_login_url, json={'email': email, 'username': email, 'password': password})
        if sso_resp.status_code != 200:
            return Response({'error': 'Invalid credentials / SSO Failed', 'details': sso_resp.text}, status=status.HTTP_401_UNAUTHORIZED)
            
        sso_data = sso_resp.json()
        
        # Explicitly check whether MFA is required
        if sso_data.get('mfa_required') is True:
            return Response({
                'require_mfa': True,
                'mfa_required': True,
                'token': sso_data.get('token'),
                'pre_auth_token': sso_data.get('token'),
                'message': sso_data.get('message', 'MFA verification required')
            }, status=status.HTTP_200_OK)
            
        # Prefer 'access' or 'access_token' for the normal login flow
        sso_access = sso_data.get('access') or sso_data.get('access_token') or sso_data.get('token')
        sso_refresh = sso_data.get('refresh') or sso_data.get('refresh_token')
        if not sso_access:
            return Response({'error': 'No SSO access token returned'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Decode the SSO JWT to extract roles and permissions
        sso_claims = decode_sso_jwt(sso_access, sso_refresh)
        
        # Fetch the user profile
        me_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/me/"
        headers = {'Authorization': f'Bearer {sso_access}'}
        me_resp = requests.get(me_url, headers=headers)
        
        if me_resp.status_code == 200:
            profile = me_resp.json()
            user = sync_user_from_sso_profile(profile, email)
            
            refresh = RefreshToken.for_user(user)
            user_data = build_user_data(user, extract_primary_role_name(profile, sso_claims), sso_claims)
            
            # Store SSO claims in the Django session
            request.session['sso_roles'] = sso_claims.get('roles', [])
            request.session['sso_permissions'] = sso_claims.get('permissions', [])
            request.session['sso_is_owner'] = sso_claims.get('is_owner', False)
            request.session['sso_org_id'] = sso_claims.get('org_id')
            request.session['sso_org_name'] = sso_claims.get('org_name')
            request.session['sso_access_token'] = sso_access
            
            response = Response({'user': user_data})
            set_auth_cookies(response, refresh)
            set_user_cookie(response, user_data)
            return response
        else:
            return Response({
                'error': 'Failed to fetch user profile after SSO login',
                'sso_status': me_resp.status_code,
                'sso_error': me_resp.text,
                'sso_keys': list(sso_data.keys())
            }, status=me_resp.status_code)
            
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    sso_register_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/register/"
    try:
        # Arnatech SSO registration requires an email and password
        payload = {
            'email': email,
            'password': password,
        }
        sso_resp = requests.post(sso_register_url, json=payload)
        
        if sso_resp.status_code not in [200, 201]:
            return Response({'error': 'Registration failed at SSO', 'details': sso_resp.text}, status=status.HTTP_400_BAD_REQUEST)
            
        # Arnatech SSO sends an OTP email after successful registration.
        # The user must verify the email before being allowed to log in.
        return Response({
            'require_verification': True,
            'email': email,
            'message': 'Registration succeeded. Check your email for the verification OTP.',
        }, status=status.HTTP_201_CREATED)

    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_view(request):
    """Proxy the email verification OTP request to Arnatech SSO."""
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    sso_verify_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/verify-email/"
    try:
        sso_resp = requests.post(sso_verify_url, json={'email': email, 'otp': otp})
        
        if sso_resp.status_code != 200:
            error_detail = sso_resp.text
            try:
                error_detail = sso_resp.json()
            except Exception:
                pass
            return Response(
                {'error': 'Verification failed', 'details': error_detail}, 
                status=sso_resp.status_code
            )
        
        return Response({
            'message': 'Email verified successfully. You can now sign in.',
            'verified': True,
        })
        
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_email_otp_view(request):
    """Proxy the resend-email-verification-OTP request to Arnatech SSO."""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    sso_resend_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/resend-email-otp/"
    try:
        sso_resp = requests.post(sso_resend_url, json={'email': email})
        
        if sso_resp.status_code != 200:
            error_detail = sso_resp.text
            try:
                error_detail = sso_resp.json()
            except Exception:
                pass
            return Response(
                {'error': 'Failed to resend OTP', 'details': error_detail}, 
                status=sso_resp.status_code
            )
        
        return Response({'message': 'A new OTP has been sent to your email.'})
        
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([AllowAny]) 
def logout_view(request):
    request.session.flush()
    response = Response(status=status.HTTP_204_NO_CONTENT)
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    response.delete_cookie('user')
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    refresh_token = request.COOKIES.get('refresh_token')
    if not refresh_token:
        refresh_token = request.data.get('refresh')

    if not refresh_token:
        return Response({'error': 'Refresh token not found'}, status=status.HTTP_401_UNAUTHORIZED)
        
    try:
        token = RefreshToken(refresh_token)
        user = CustomUser.objects.get(id=token['user_id'])
        new_refresh_token = RefreshToken.for_user(user)
        
        sso_claims = {
            'roles': request.session.get('sso_roles', []),
            'permissions': request.session.get('sso_permissions', []),
            'is_owner': request.session.get('sso_is_owner', False),
            'org_id': request.session.get('sso_org_id'),
            'org_name': request.session.get('sso_org_name'),
        }

        user_data = build_user_data(user, extract_primary_role_name(sso_claims=sso_claims), sso_claims)
        
        response = Response({
            'access': str(new_refresh_token.access_token),
            'user': user_data
        })
        set_auth_cookies(response, new_refresh_token)
        set_user_cookie(response, user_data)
        return response
    except (TokenError, CustomUser.DoesNotExist):
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

# --- SSO token header helper ---
def get_sso_auth_headers(request):
    sso_token = request.session.get('sso_access_token')
    if not sso_token:
        # If the token is missing, the user must sign in again 
        # (this happens when the Django session is cleared or the token expires)
        return None
    return {'Authorization': f'Bearer {sso_token}'}

# --- MFA proxy views ---
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_mfa_login_view(request):
    """
    Verify the MFA OTP code.
    Supports two contexts:
    1. Login: requires 'token' (pre-auth) + 'mfa_token'.
    2. Setup/activation: requires 'mfa_token' and an authenticated user.
    """
    token = request.data.get('token') or request.data.get('pre_auth_token')
    mfa_token = request.data.get('mfa_token') or request.data.get('otp')
    email = request.data.get('email')
    
    # If there is no pre-auth token, check whether this is an already authenticated setup flow
    is_setup_context = not token and request.user.is_authenticated
    
    if not mfa_token:
        return Response({'error': 'MFA Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if not token and not is_setup_context:
        return Response({'error': 'Token is required (Login) or you must be logged in (Setup)'}, status=status.HTTP_400_BAD_REQUEST)
        
    sso_mfa_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/mfa/verify/"
    try:
        # For setup flows, use the Authorization header
        # For login flows, pass the token in the request body
        payload = {'mfa_token': mfa_token}
        headers = {}
        
        if is_setup_context:
            headers = get_sso_auth_headers(request)
            if not headers:
                return Response({'error': 'SSO session expired. Please re-login.'}, status=status.HTTP_401_UNAUTHORIZED)
            # Some SSO implementations expect `otp` while others expect `mfa_token`
            payload = {'mfa_token': mfa_token, 'otp': mfa_token}
        else:
            payload['token'] = token
            payload['otp'] = mfa_token # Redundancy for SSO compatibility

        sso_resp = requests.post(sso_mfa_url, json=payload, headers=headers)
        
        if sso_resp.status_code != 200:
            error_detail = sso_resp.text
            try:
                error_detail = sso_resp.json()
            except Exception:
                pass
            return Response({'error': 'MFA Verification failed', 'details': error_detail}, status=status.HTTP_400_BAD_REQUEST)
            
        # If this is setup only, return success without creating a new session
        if is_setup_context:
            return Response({'message': 'MFA successfully activated!', 'verified': True})

        # Standard login flow for requests that include a pre-auth token
        sso_data = sso_resp.json()
        sso_access = sso_data.get('access') or sso_data.get('access_token') or sso_data.get('token')
        sso_refresh = sso_data.get('refresh') or sso_data.get('refresh_token')
        if not sso_access:
            return Response({'error': 'No SSO access token returned'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        sso_claims = decode_sso_jwt(sso_access, sso_refresh)
        
        me_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/me/"
        headers_me = {'Authorization': f'Bearer {sso_access}'}
        me_resp = requests.get(me_url, headers=headers_me)
        
        if me_resp.status_code == 200:
            profile = me_resp.json()
            user_email = profile.get('email') or email
            user = sync_user_from_sso_profile(profile, user_email)
            
            refresh = RefreshToken.for_user(user)
            user_data = build_user_data(user, extract_primary_role_name(profile, sso_claims), sso_claims)
            
            request.session['sso_roles'] = sso_claims.get('roles', [])
            request.session['sso_permissions'] = sso_claims.get('permissions', [])
            request.session['sso_is_owner'] = sso_claims.get('is_owner', False)
            request.session['sso_org_id'] = sso_claims.get('org_id')
            request.session['sso_org_name'] = sso_claims.get('org_name')
            request.session['sso_access_token'] = sso_access
            
            response = Response({'user': user_data})
            set_auth_cookies(response, refresh)
            set_user_cookie(response, user_data)
            return response
        else:
            return Response({
                'error': 'Failed to fetch user profile post-MFA',
                'sso_status': me_resp.status_code,
                'sso_error': me_resp.text,
                'sso_keys': list(sso_data.keys())
            }, status=me_resp.status_code)
            
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mfa_status_view(request):
    headers = get_sso_auth_headers(request)
    if not headers:
        return Response({'error': 'The SSO session has expired. Please sign in again.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    mfa_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/mfa/status/"
    try:
        resp = requests.get(mfa_url, headers=headers)
        return Response(resp.json(), status=resp.status_code)
    except requests.RequestException as e:
        return Response({'error': 'SSO Request Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mfa_setup_view(request):
    headers = get_sso_auth_headers(request)
    if not headers:
         return Response({'error': 'The SSO session has expired. Please sign in again.'}, status=status.HTTP_401_UNAUTHORIZED)
         
    mfa_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/mfa/set/"
    try:
        # request.data may include optional payload fields (empty for generate, mfa_token for enable)
        resp = requests.post(mfa_url, headers=headers, json=request.data)
        
        # Validate the response shape so the frontend does not hit a TypeError.
        res_data = resp.text
        try:
            res_data = resp.json()
        except Exception:
            pass
            
        return Response(res_data, status=resp.status_code)
    except requests.RequestException as e:
         return Response({'error': 'SSO Request Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mfa_disable_view(request):
    """
    Menonaktifkan MFA. Mendukung salah satu: Password saja ATAU OTP saja.
    """
    headers = get_sso_auth_headers(request)
    if not headers:
         return Response({'error': 'The SSO session has expired. Please sign in again.'}, status=status.HTTP_401_UNAUTHORIZED)
         
    password = request.data.get('password')
    mfa_token = request.data.get('otp') or request.data.get('mfa_token') or request.data.get('totp')
    
    if not password and not mfa_token:
        return Response({'error': 'Either Password or OTP is required to disable MFA'}, status=status.HTTP_400_BAD_REQUEST)

    mfa_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/mfa/disable/"
    try:
        # Arnatech SSO expects `password` and `totp` keys
        payload = {}
        if password: payload['password'] = password
        if mfa_token: payload['totp'] = mfa_token
            
        resp = requests.post(mfa_url, headers=headers, json=payload)
        res_data = resp.text
        try:
            res_data = resp.json()
        except Exception:
            pass
        return Response(res_data, status=resp.status_code)
    except requests.RequestException as e:
         return Response({'error': 'SSO Request Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([AllowAny])
def passkeys_list(request):
    sso_passkeys_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/passkeys/"
    headers = {
        "Authorization": request.headers.get("Authorization", ""),
    }
    # headers = {
    #     "Authorization": f"Bearer {request.COOKIES.get('access_token')}"
    # }
    try:
        sso_resp = requests.get(sso_passkeys_url, headers=headers)
        if sso_resp.status_code != 200:
            return Response({'error': 'Failed to fetch Passkeys', 'details': sso_resp.text}, status=sso_resp.status_code)
        return Response(sso_resp.json())
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([AllowAny])
def passkeys_login_begin(request):
    sso_passkeys_login_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/passkeys/login/begin/"
    try:
        sso_resp = requests.get(sso_passkeys_login_url)
        if sso_resp.status_code != 200:
            return Response({'error': 'Failed to initiate Passkeys login', 'details': sso_resp.text}, status=sso_resp.status_code)
        return Response(sso_resp.json())
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([AllowAny])
def passkeys_login_complete(request):
    sso_passkeys_login_complete_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/passkeys/login/complete/"
    headers = {
        "Authorization": request.headers.get("Authorization", ""),
    }
    # headers = {
    #     "Authorization": f"Bearer {request.COOKIES.get('access_token')}"
    # }
    try:
        sso_resp = requests.post(sso_passkeys_login_complete_url, json=request.data, headers=headers)
        if sso_resp.status_code != 200:
            return Response({'error': 'Failed to complete Passkeys login', 'details': sso_resp.text}, status=sso_resp.status_code)
        return Response(sso_resp.json())
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([AllowAny])
def passkeys_register_begin(request):
    sso_passkeys_register_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/passkeys/register/begin/"
    headers = {
        "Authorization": request.headers.get("Authorization", ""),
    }
    # headers = {
    #     "Authorization": f"Bearer {request.COOKIES.get('access_token')}"
    # }
    try:
        sso_resp = requests.get(sso_passkeys_register_url, headers=headers)
        if sso_resp.status_code != 200:
            return Response({'error': 'Failed to initiate Passkeys registration', 'details': sso_resp.text}, status=sso_resp.status_code)
        return Response(sso_resp.json())
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([AllowAny])
def passkeys_register_complete(request):
    sso_passkeys_register_complete_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/passkeys/register/complete/"
    headers = {
        "Authorization": request.headers.get("Authorization", ""),
    }
    # headers = {
    #     "Authorization": f"Bearer {request.COOKIES.get('access_token')}"
    # }
    try:
        sso_resp = requests.post(sso_passkeys_register_complete_url, json=request.data, headers=headers)
        if sso_resp.status_code != 200:
            return Response({'error': 'Failed to complete Passkeys registration', 'details': sso_resp.text}, status=sso_resp.status_code)
        return Response(sso_resp.json())
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def passkeys_delete(request, id):
    sso_passkeys_delete_url = f"{settings.SSO_ARNATECH_BASE_URL}/api/auth/passkeys/delete/{id}/"
    headers = {
        "Authorization": request.headers.get("Authorization", ""),
    }
    # headers = {
    #     "Authorization": f"Bearer {request.COOKIES.get('access_token')}"
    # }
    try:
        sso_resp = requests.delete(sso_passkeys_delete_url, headers=headers)
        if sso_resp.status_code != 200:
            return Response({'error': 'Failed to delete Passkeys', 'details': sso_resp.text}, status=sso_resp.status_code)
        return Response({'message': 'Passkeys deleted successfully'})
    except requests.RequestException as e:
        return Response({'error': 'SSO Integration Error', 'details': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([HasSSOPermission('users')])
def role_list(request):
    return Response([])

# --- User management ---
@api_view(['GET', 'POST'])
@permission_classes([HasSSOPermission('users')])
def user_list_create(request):
    if request.method == 'GET':
        users = CustomUser.objects.exclude(pk=request.user.pk).order_by('username')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.set_password(request.data.get('password'))
            user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([HasSSOPermission('users')])
def user_detail(request, pk):
    try:
        if request.user.pk == pk:
             return Response({'error': 'Cannot manage your own account.'}, status=status.HTTP_403_FORBIDDEN)
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()
            if 'password' in request.data and request.data['password']:
                updated_user.set_password(request.data['password'])
                updated_user.save()
            return Response(UserSerializer(updated_user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
