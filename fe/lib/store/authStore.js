import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

const parseUserCookie = (userCookie) => {
  if (!userCookie) return null;

  let decodedCookie = userCookie;
  if (!userCookie.startsWith('{')) {
    let b64 = userCookie.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }
    decodedCookie = decodeURIComponent(escape(atob(b64)));
  }

  return JSON.parse(decodedCookie);
};

const syncStoreAfterPersistRehydrate = (state, setState) => {
  const userCookie = Cookies.get('user');
  if (userCookie) {
    try {
      const parsedUser = parseUserCookie(userCookie);
      setState({
        user: parsedUser,
        isAuthenticated: true,
        access_token: parsedUser?.access || '',
        refresh_token: parsedUser?.refresh || '',
      });
      return;
    } catch (e) {
      console.error('Failed to parse user cookie', e);
      Cookies.remove('user', { path: '/' });
    }
  }

  if (state?.user) {
    setState({
      isAuthenticated: true,
      access_token: state.user.access || '',
      refresh_token: state.user.refresh || '',
    });
    return;
  }

  setState({
    user: null,
    isAuthenticated: false,
    access_token: '',
    refresh_token: '',
  });
};

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        access_token: '',
        refresh_token: '',

        // Login action
        login: (userData) => {
          set({
            user: userData,
            isAuthenticated: true,
            access_token: userData.access,
            refresh_token: userData.refresh,
          });
        },

        // Logout action
        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            access_token: '',
            refresh_token: '',
          });
        },

        // --- Permission helpers ---
        /**
         * Check whether the user has a specific permission.
         * Example: hasPermission('view.asset') -> true/false
         */
        hasPermission: (permission) => {
          const user = get().user;
          if (!user) return false;
          if (user.is_owner) return true; // Owners have full access
          return (user.permissions || []).includes(permission);
        },

        /**
         * Check whether the user has at least one permission from a list.
         * Example: hasAnyPermission(['view.asset', 'manage.asset']) -> true/false
         */
        hasAnyPermission: (permissions) => {
          const user = get().user;
          if (!user) return false;
          if (user.is_owner) return true;
          return permissions.some((p) => (user.permissions || []).includes(p));
        },

        /**
         * Check whether the user is the organization owner.
         */
        isOwner: () => {
          const user = get().user;
          return user?.is_owner === true;
        },

        // Initialize auth from cookies
        initializeAuth: () => {
          const userCookie = Cookies.get('user');

          if (userCookie) {
            try {
              const parsedUser = parseUserCookie(userCookie);
              set({ user: parsedUser, isAuthenticated: true });
            } catch (e) {
              console.error('Failed to parse user cookie', e);
              Cookies.remove('user', { path: '/' });
            }
          } else {
            set({ user: null, isAuthenticated: false });
          }
        },
      }),
      {
        name: 'auth-storage',

        onRehydrateStorage: () => (state, error) => {
          if (error) return;

          syncStoreAfterPersistRehydrate(state, (partial) => useAuthStore.setState(partial));
        },
      }
    )
  )
);

export default useAuthStore;
