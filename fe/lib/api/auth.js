"use client"

import axiosClient from "./axiosClient";
import Cookies from "js-cookie";
import useAuthStore from "../store/authStore";

const getAuthHeaders = () => {
  const token = Cookies.get("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getAuthHeadersFromStorage = () => {
  const token = (useAuthStore.getState().access_token).trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const login = async (credentials) => {
  const response = await axiosClient.post("/api/auth/login/", credentials);
  return response;
};

export const register = async (userData) => {
  const response = await axiosClient.post("/api/auth/register/", userData);
  return response;
};

export const logout = async () => {
  const response = await axiosClient.post("/api/auth/logout/");
  return response;
};

export const refresh = async () => {
  const response = await axiosClient.post("/api/auth/token/refresh/");
  return response;
};

export const ssoGoogleLogin = async (data) => {
  const response = await axiosClient.post("/api/auth/sso/google/", data);
  return response;
};

export const verifyEmail = async (data) => {
  const response = await axiosClient.post("/api/auth/verify-email/", data);
  return response;
};

export const resendEmailOtp = async (data) => {
  const response = await axiosClient.post("/api/auth/resend-email-otp/", data);
  return response;
};

// --- MFA Endpoints ---
export const getMfaStatus = async () => {
  const response = await axiosClient.get("/api/auth/mfa/status/", { headers: getAuthHeaders() });
  return response;
};

export const mfaSetup = async () => {
  const response = await axiosClient.post("/api/auth/mfa/set/", {}, { headers: getAuthHeaders() });
  return response;
};

export const mfaVerify = async (data) => {
  // data: { otp } (for setup/login verify) and optionally { pre_auth_token } for login
  // Note: /api/auth/mfa/verify/ for setup requires Authorization. For login verify, it might not need it if using pre_auth_token, but adding it doesn't hurt.
  const response = await axiosClient.post("/api/auth/mfa/verify/", data, { headers: getAuthHeaders() });
  return response;
};

export const mfaDisable = async (data) => {
  // data: { otp, password }
  const response = await axiosClient.post("/api/auth/mfa/disable/", data, { headers: getAuthHeaders() });
  return response;
};


// ─── Base64url helpers ──────────────────────────────────────────────────────

/** Decode a base64url string to ArrayBuffer (WebAuthn-compatible). */
export function decodeBase64Url(b64u) {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/** Encode an ArrayBuffer / Uint8Array to a base64url string. */
export function encodeBase64Url(buf) {
  return btoa(
    String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf.buffer : buf))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Convert the raw begin options so the browser can use them. */
export function prepareRegisterOptions(opts) {
  return {
    publicKey: {
      ...opts.publicKey,
      challenge: decodeBase64Url(opts.publicKey.challenge),
      // rpId yang dikirim dari server harus disesuaikan dengan hostname/domain frontend saat ini.
      // domain fe saat ini (http://localhost) tidak cocok dengan rpId domain saat ini (arnatech.id) yang dikirim server.
      // rp: {
      //   ...opts.publicKey.rp,
      //   id: window.location.hostname === "localhost"
      //     ? window.location.hostname // ✅ "localhost"
      //     : opts.publicKey.rp.id,
      // },
      user: {
        ...opts.publicKey.user,
        id: decodeBase64Url(opts.publicKey.user.id),
      },
      excludeCredentials: opts.publicKey.excludeCredentials?.map(c => ({
        id: decodeBase64Url(c.id),
        type: c.type,
        transports: c.transports,
      })),
    },
  };
}

/** Convert the raw login begin options. */
export function prepareGetOptions(opts) {
  return {
    publicKey: {
      ...opts.publicKey,
      challenge: decodeBase64Url(opts.publicKey.challenge),
      allowCredentials: opts.publicKey.allowCredentials?.map(c => ({
        id: decodeBase64Url(c.id),
        type: c.type,
        transports: c.transports,
      })),
    },
  };
}

/** Encode a PublicKeyCredential (create) into the payload expected by complete. */
export function encodeRegisterCredential(cred, keyName) {
  const resp = cred.response;
  return {
    id: cred.id,
    rawId: encodeBase64Url(cred.rawId),
    type: cred.type,
    key_name: keyName || "My device",
    response: {
      attestationObject: encodeBase64Url(resp.attestationObject),
      clientDataJSON: encodeBase64Url(resp.clientDataJSON),
    },
  };
}

/** Encode a PublicKeyCredential (get) into the assertion payload. */
export function encodeAssertionCredential(cred) {
  const resp = cred.response;
  return {
    id: cred.id,
    rawId: encodeBase64Url(cred.rawId),
    type: cred.type,
    response: {
      authenticatorData: encodeBase64Url(resp.authenticatorData),
      clientDataJSON: encodeBase64Url(resp.clientDataJSON),
      signature: encodeBase64Url(resp.signature),
      userHandle: resp.userHandle ? encodeBase64Url(resp.userHandle) : null,
    },
  };
}

export const passKeysList = async () => {
  console.log("Fetching passkeys list with auth headers:", getAuthHeadersFromStorage());
  const response = await axiosClient.get("/api/auth/passkeys/", { headers: getAuthHeadersFromStorage() });
  return response;
}

export const passKeysDelete = async (keyId) => {
  const response = await axiosClient.delete(`/api/auth/passkeys/${keyId}/`, { headers: getAuthHeadersFromStorage() });
  return response;
}

export const passKeysRegisterBegin = async () => {
  const response = await axiosClient.get("/api/auth/passkeys/register/begin/", { headers: getAuthHeadersFromStorage() });
  return response;
}

export const passKeysRegisterComplete = async (data) => {
  const response = await axiosClient.post("/api/auth/passkeys/register/complete/", data, { headers: getAuthHeadersFromStorage() });
  return response;
}

export const passKeysLoginBegin = async () => {
  const response = await axiosClient.get("/api/auth/passkeys/login/begin/", { });
  return response;
}

export const passKeysLoginComplete = async (data) => {
  const response = await axiosClient.post("/api/auth/passkeys/login/complete/", data, { headers: getAuthHeadersFromStorage() });
  return response;
}
