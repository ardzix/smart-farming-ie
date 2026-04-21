from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('sso/google/', views.google_login_sso, name='sso-google'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('verify-email/', views.verify_email_view, name='verify-email'),
    path('resend-email-otp/', views.resend_email_otp_view, name='resend-email-otp'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', views.refresh_view, name='token_refresh'),
    
    # MFA endpoints
    path('mfa/verify/', views.verify_mfa_login_view, name='mfa-verify'),
    path('mfa/status/', views.mfa_status_view, name='mfa-status'),
    path('mfa/set/', views.mfa_setup_view, name='mfa-set'),
    path('mfa/disable/', views.mfa_disable_view, name='mfa-disable'),
    
    # Passkey proxy endpoints
    path('passkeys/', views.passkeys_list, name='passkeys-list'),
    path('passkeys/login/begin/', views.passkeys_login_begin, name='passkeys-login-begin'),
    path('passkeys/login/complete/', views.passkeys_login_complete, name='passkeys-login-complete'),
    path('passkeys/register/begin/', views.passkeys_register_begin, name='passkeys-register-begin'),
    path('passkeys/register/complete/', views.passkeys_register_complete, name='passkeys-register-complete'),
    path('passkeys/delete/<str:id>/', views.passkeys_delete, name='passkeys-delete'),

    
    # Legacy role endpoint
    path('roles/', views.role_list, name='role-list'), 

    # User management
    path('users/', views.user_list_create, name='user-list-create'),
    path('users/<int:pk>/', views.user_detail, name='user-detail'),
]