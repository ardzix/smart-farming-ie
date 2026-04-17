from rest_framework import permissions

class IsAdminOrSuperadmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.user.role:
            return request.user.role.name in ['Admin', 'Superadmin']
        return False

class IsOperatorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.user.role:
            return request.user.role.name in ['Operator', 'Admin', 'Superadmin']
        return False

class IsSuperadmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.user.role:
            return request.user.role.name == 'Superadmin'
        return False

# --- BARU: Izin Read-Only untuk Viewer & Investor ---
class IsViewerOrInvestorReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Hanya izinkan method aman (GET, HEAD, OPTIONS)
        if request.method not in permissions.SAFE_METHODS:
            return False
            
        if request.user.role:
            return request.user.role.name in ['Viewer', 'Investor']
        return False

# --- SSO BACA: Factory untuk SSO Permission ---
def HasSSOPermission(resource_name):
    """
    Factory function to generate a permission class for a specific resource.
    SSO provides claims like 'manage.expense', 'view.asset', 'is_owner'.
    """
    class _HasSSOPermission(permissions.BasePermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False
                
            # 1. Superadmin Level (Full access) via is_owner
            if request.session.get('sso_is_owner', False):
                return True
                
            sso_perms = request.session.get('sso_permissions', [])
            
            # 2. Check complete manage access
            if f'manage.{resource_name}' in sso_perms:
                return True
                
            # 3. Check read-only access
            if request.method in permissions.SAFE_METHODS:
                if f'view.{resource_name}' in sso_perms:
                    return True
                    
            return False
            
    return _HasSSOPermission