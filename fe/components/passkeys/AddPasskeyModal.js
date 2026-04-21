"use client";

import { Button, Form, Input, message, Modal } from "antd";
import { useEffect } from "react";
import { usePasskeysRegister } from "../../lib/hooks/useAuth.js";

export default function AddPasskeyModal({ open, onCancel }) {
  const [form] = Form.useForm();

  const { mutate: registerPasskey, isPending: isRegistering } =
    usePasskeysRegister();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleConfirmRegister = (value) => {
    if (!value?.passkeyName?.trim()) return;

    registerPasskey(value.passkeyName.trim(), {
      onSuccess: () => {
        message.success("Passkey created successfully");
        onCancel();
      },
    });
  };

  return (
    <Modal
      open={open}
      title="Register New Passkey"
      onCancel={() => {
        if (!isRegistering) onCancel();
      }}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={isRegistering}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isRegistering}
          onClick={() => form.submit()}
        >
          Buat Passkey
        </Button>,
      ]}
    >
      <div className="space-y-4 pt-4">
        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
          Harap pastikan untuk memberikan nama yang mudah diingat untuk passkey ini, seperti &quot;Passkey Laptop&quot; atau &quot;Passkey Mobile&quot;. Setelah dibuat, Anda dapat menggunakan passkey ini untuk login tanpa perlu memasukkan password.
        </p>

        <Form form={form} layout="vertical" onFinish={handleConfirmRegister}>
          <Form.Item 
            name="passkeyName" 
            label="Nama Passkey" 
            rules={[{ required: true }]}
          >
            <Input placeholder="Masukkan nama passkey" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
