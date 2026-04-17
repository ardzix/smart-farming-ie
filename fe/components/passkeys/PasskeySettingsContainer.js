"use client";

import { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Modal,
  Tooltip,
  message,
} from "antd";
import { KeyOutlined, DeleteOutlined } from "@ant-design/icons";
import colors from "../../lib/colors.js";
import {
  usePasskeysDelete,
  usePasskeysList,
} from "../../lib/hooks/useAuth.js";
import AddPasskeyModal from "./AddPasskeyModal";

const { Title, Text } = Typography;

export default function PasskeySettingsContainer() {
  // Queries and mutations
  const { data: passkeys = [], isLoading: isLoadingKeys } = usePasskeysList(true);
  const { mutateAsync: deletePasskeyAsync } = usePasskeysDelete();

  const [modal, contextHolder] = Modal.useModal();

  const handleDelete = (id, name) => {
    modal.confirm({
      title: "Delete passkey",
      content: `Are you sure you want to delete "${name}"?`,
      okText: "Confirm",
      okButtonProps: {
        type: "primary",
        danger: true,
      },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deletePasskeyAsync(id);
          message.success("Passkey deleted successfully");
        } catch (error) {
          message.error(
            error?.response?.data?.message || "Failed to delete passkey"
          );
        }
      },
    });
  };

  // Local state for registering a new passkey
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleRegisterMenuClick = () => {
    setIsRegisterModalOpen(true);
  };

  const columns = [
    {
      title: "Key Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      render: (plat) => {
        if (!plat) return "-";
        return <Tag color="blue">{plat}</Tag>;
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleString() : "-",
    },
    {
      title: "Last Used",
      dataIndex: "last_used",
      key: "last_used",
      render: (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleString() : "-",
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Tooltip title="Delete Passkey">
          <Button
            shape="circle"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.name)}
            style={{
              backgroundColor: colors.error.main,
              borderColor: colors.error.main,
              color: colors.error.contrast,
            }}
            className="hover:opacity-80 transition-opacity"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      <Card 
        styles={{ body: { padding: '32px' } }}
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          marginTop: 0,
          marginBottom: 80
        }}
      >
        <div className="space-y-5">
          <div className="flex flex-col justify-between mb-4">
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: '#FDF6B2', color: '#8A2C0D', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' 
                }}>
                  <KeyOutlined />
                </div>
                <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111928' }}>
                  Otentikasi Passkeys
                </Title>
              </div>
              <Text style={{ color: '#6B7280', fontSize: '14px', marginLeft: '44px', display: 'block' }}>
                Kode sandi memungkinkan Anda untuk masuk dengan aman menggunakan kunci layar perangkat Anda (Touch ID, Face ID, Windows Hello, atau PIN).
              </Text>
            </div>

            <Button
              type="primary"
              style={{ background: '#237804', borderColor: '#237804', alignSelf: 'flex-end' }}
              onClick={handleRegisterMenuClick}
            >
              Tambah Passkey
            </Button>
          </div>

          <Table
            dataSource={passkeys}
            columns={columns}
            rowKey="id"
            loading={isLoadingKeys}
            pagination={false}
            locale={{
              emptyText: "Belum ada passkey terdaftar. Klik 'Tambah Passkey' untuk menambahkan passkey baru.",
            }}
          />
        </div>

      </Card>

      <AddPasskeyModal
        open={isRegisterModalOpen}
        onCancel={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}