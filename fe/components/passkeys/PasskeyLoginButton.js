"use client";

import { Button, Modal } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import { usePasskeysLogin } from "../../lib/hooks/useAuth.js";

export default function PasskeyLoginButton() {
  const { mutate: loginWithPasskey, isPending } = usePasskeysLogin();

  const isSupported =
    typeof window !== "undefined" && !!window.PublicKeyCredential;

  if (!isSupported) return null;

  const handleClick = () => {
    if (isPending) return;

    loginWithPasskey(undefined, {
      onError: (err) => {
        const e = err;
        if (e?.code === "CANCELLED") return;

        const resp = err?.response?.data;
        const detail =
          resp && typeof resp === "object"
            ? String(Object.values(resp)[0])
            : e?.message;

        Modal.error({
          title: "Login Failed",
          content: detail || "An error occurred during passkey login",
        });
      },
    });
  };

  // const isDark = mode === "dark";
  const isDark = true;

  return (
    <Button
      shape="round"
      block
      loading={isPending}
      onClick={handleClick}
      style={{
        height: 40,
        width: "56%",
        padding: "0 2px",
        display: "flex",
        alignItems: "center",
        border: isDark ? "none" : "1px solid #dadce0",
      }}
      className={`mt-2 font-sans !transition-colors !duration-200 shadow-none outline-none ${
        isDark
          ? "!bg-[#202124] hover:!bg-[#2b2b2b]"
          : "!bg-white hover:!bg-[#f8f9fa]"
      }`}
    >
      {
        (!isPending) && (
          <div
            className={`flex items-center justify-center rounded-full ml-0.5 ${
              isDark ? "bg-white" : "bg-transparent"
            }`}
            style={{ width: "34px", height: "34px" }}
          >
            <KeyOutlined
              className={isDark ? "text-black text-[18px]" : "text-[#3c4043] text-[18px]"}
            />
          </div>
        )
      }
      <span
        className="flex-1 text-center pr-[34px] tracking-wide"
        style={{
          fontSize: 14,
          color: isDark ? "#ffffff" : "#3c4043",
        }}
      >
        Login via Passkey
      </span>
    </Button>
  );
}