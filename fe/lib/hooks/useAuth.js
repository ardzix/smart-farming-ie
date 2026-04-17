import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as authAPI from '@/lib/api/auth';
import useAuthStore from '@/lib/store/authStore';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { message, Modal } from 'antd';

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials) => authAPI.login(credentials),
    onSuccess: async (response) => {
      const { user, mfa_required, access_token } = response.data;

      // Simpan access_token ke cookie yang bisa dibaca JS (non-HTTPOnly)
      if (access_token) {
        Cookies.set('access_token', access_token, { expires: 1, path: '/' });
      }

      if (mfa_required) {
        // Biarkan komponen yang menangani pop-up/form MFA
        return;
      }

      if (!user) {
        return;
      }

      loginToStore(user);
      Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
      router.push('/admin');
    },
    onError: (error) => {
      console.error(error.response?.data || error.message);
    },
  });
};

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (userData) => authAPI.register(userData),
    onSuccess: async (response) => {
      const { require_verification, email, message: serverMessage } = response.data;

      if (require_verification) {
        // SSO Arnatech butuh verifikasi email via OTP sebelum bisa login
        message.success(serverMessage || 'Pendaftaran berhasil! Silakan verifikasi email Anda.');
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else if (response.data.user) {
        // Fallback jika SSO langsung auto-login
        const loginToStore = useAuthStore.getState().login;
        loginToStore(response.data.user);
        Cookies.set('user', JSON.stringify(response.data.user), { expires: 1, path: '/' });
        router.push('/admin');
      } else {
        message.success(serverMessage || 'Pendaftaran berhasil, silakan login.');
        router.push('/login');
      }
    },
    onError: (error) => {
      console.error(error.response?.data || error.message);
    },
  });
};

export const useLogout = () => {
  const logoutFromStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user', { path: '/' });
      Cookies.remove('access_token', { path: '/' });
      router.push('/login');
    },
    onError: (error) => {
      logoutFromStore();
      queryClient.clear();
      Cookies.remove('user', { path: '/' });
      Cookies.remove('access_token', { path: '/' });
      router.push('/login');
    }
  });
};

export const useSsoLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (data) => authAPI.ssoGoogleLogin(data),
    onSuccess: async (response) => {
      const { user, access_token } = response.data;

      // Simpan access_token ke cookie yang bisa dibaca JS
      if (access_token) {
        Cookies.set('access_token', access_token, { expires: 1, path: '/' });
      }

      if (!user) {
        return;
      }

      loginToStore(user);
      Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
      router.push('/admin');
    },
    onError: (error) => {
      console.error('SSO Login Error:', error.response?.data || error.message);
      message.error('Terjadi kesalahan saat otorisasi masuk via Google.');
    },
  });
};

export const useVerifyEmail = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (data) => authAPI.verifyEmail(data),
    onSuccess: async (response) => {
      message.success(response.data.message || 'Email berhasil diverifikasi!');
      router.push('/login');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message;
      console.error('Verify Email Error:', errorMsg);
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    },
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (data) => authAPI.resendEmailOtp(data),
    onSuccess: (response) => {
      message.success(response.data.message || 'Kode OTP baru telah dikirim.');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || error.message;
      console.error('Resend OTP Error:', errorMsg);
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Gagal mengirim ulang OTP.');
    },
  });
};

export const useMfaSetup = () => {
  return useMutation({
    mutationFn: () => authAPI.mfaSetup(),
  });
};

export const useMfaVerifySetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => authAPI.mfaVerify(data),
    onSuccess: () => {
      message.success('MFA berhasil diaktifkan!');
      queryClient.invalidateQueries({ queryKey: ['mfaStatus'] });
    },
    onError: (error) => {
      message.error(error.response?.data?.message || error.response?.data?.error || 'Gagal verifikasi setup MFA.');
    }
  });
};

export const useMfaDisable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => authAPI.mfaDisable(data),
    onSuccess: () => {
      message.success('MFA berhasil dinonaktifkan.');
      queryClient.invalidateQueries({ queryKey: ['mfaStatus'] });
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Password atau OTP salah, atau gagal menonaktifkan MFA.');
    }
  });
};

export const useMfaVerifyLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: (data) => authAPI.mfaVerify(data), // { otp, pre_auth_token }
    onSuccess: async (response) => {
      const { user, access_token } = response.data;

      // Simpan access_token dari MFA verify
      if (access_token) {
        Cookies.set('access_token', access_token, { expires: 1, path: '/' });
      }

      if (user) {
        loginToStore(user);
        Cookies.set('user', JSON.stringify(user), { expires: 1, path: '/' });
        router.push('/admin');
      } else {
        message.success('MFA Verified, Redirecting...');
      }
    },
    onError: (error) => {
      message.error(error.response?.data?.message || error.response?.data?.error || 'Kode OTP tidak valid.');
    },
  });
};

export const usePasskeysList = (enabled) => {
  return useQuery({
    queryKey: ['PASSKEY_LIST'],
    queryFn: async () => {
      const data = await authAPI.passKeysList();
      return Array.isArray(data) ? data : [];
    },
    enabled,
  });
}

export const usePasskeysDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => authAPI.passKeysDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['PASSKEY_LIST'] });
      message.success('Passkey berhasil dihapus.');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Gagal menghapus passkey.');
    }
  });
};

export const usePasskeysRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyName) => {
      // 1. Begin
      const beginData = await authAPI.passKeysRegisterBegin();
      const createOptions = authAPI.prepareRegisterOptions(beginData.data);

      // 2. Browser prompt
      let credential;
      try {
        credential = await navigator.credentials.create(createOptions);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("cancelled") || msg.includes("NotAllowedError")) {
          throw Object.assign(new Error("cancelled"), { code: "CANCELLED" });
        }
        throw err;
      }

      if (!credential) {
        throw new Error("No credential returned by browser");
      }

      // 3. Complete
      const payload = authAPI.encodeRegisterCredential(credential, keyName);
      await authAPI.passKeysRegisterComplete(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["PASSKEY_LIST"] });
      message.success("Passkey registered successfully");
    },
    onError: (err) => {
      const e = err;
      if (e?.code === "CANCELLED") {
        message.warning("Registration cancelled");
        return;
      }
      message.error(e?.message || "Failed to register passkey");
    },
  });
}

export const usePasskeysLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // 1. Begin
      const beginData = await authAPI.passKeysLoginBegin();
      const getOptions = authAPI.prepareGetOptions(beginData.data);

      // 2. Browser prompt
      let assertion;
      try {
        assertion = await navigator.credentials.get(getOptions);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("cancelled") || msg.includes("NotAllowedError")) {
          throw Object.assign(new Error("cancelled"), { code: "CANCELLED" });
        }
        throw err;
      }

      if (!assertion) {
        throw new Error("No assertion returned by browser");
      }

      // 3. Complete
      const payload = authAPI.encodeAssertionCredential(assertion);
      const result = await authAPI.passKeysLoginComplete(payload);
      return result;
    },
    onSuccess: async (res) => {
      let access = res.access || res.token;
      let refresh = res.refresh;
      if (!access) {
        message.error("Login failed: No access token received");
        return;
      }

      let userData = {
        id: 0,
        username: res.full_name || "",
        email: res.email || "",
        role: null,
        permissions: [],
        is_owner: false,
        org_id: null,
        org_name: null
      };

      loginToStore(userData);
      Cookies.set('user', JSON.stringify(userData), { expires: 1, path: '/' });
      Cookies.set('access_token', access, { expires: 1, path: '/' });
      Cookies.set('refresh_token', refresh, { expires: 7, path: '/' });
      router.push('/admin');
    },
    onError: (err) => {
      const e = err;
      if (e?.code === "CANCELLED") {
        return; // user cancelled — silent
      }
      const resp = err?.response?.data;
      const detail = resp && typeof resp === "object"
        ? Object.values(resp).join(", ")
        : e?.message;

      Modal.error({
        title: "Passkey Login Failed",
        content: detail || "An error occurred during passkey login",
      });
    },
  });
}