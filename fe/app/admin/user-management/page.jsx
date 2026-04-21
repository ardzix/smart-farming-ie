'use client';

import React, { useState } from 'react';
import {
  Table, Card, Button, Tag, Space, Modal, Form, Input,
  Typography, message, Popconfirm, Tooltip, Row, Col, Alert
} from 'antd';
import {
  UserAddOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, PhoneOutlined, HomeOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api/user';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Title, Text } = Typography;

const UserManagementContent = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');

  const { data: users, isLoading: loadingUsers, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const mutationOptions = {
    onSuccess: () => {
      message.success(editingUser ? 'User berhasil diperbarui' : 'User berhasil dibuat');
      handleCancel();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
      message.error(`Gagal: ${errorMsg}`);
    }
  };

  const createMutation = useMutation({ mutationFn: createUser, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => updateUser(id, data), ...mutationOptions });
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('User berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => message.error('Gagal menghapus user')
  });

  const showModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.profile?.phone,
        address: user.profile?.address,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  const columns = [
    {
      title: 'User Info',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 16 }}>{record.username}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
        </Space>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        String(record.username).toLowerCase().includes(value.toLowerCase()) ||
        String(record.email).toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Access Source',
      key: 'access_source',
      render: () => <Tag color="blue">SSO Arnatech</Tag>
    },
    {
      title: 'Kontak',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.profile?.phone && (
            <Space><PhoneOutlined style={{ color: '#237804' }} /><Text>{record.profile.phone}</Text></Space>
          )}
          {record.profile?.address && (
            <Space><HomeOutlined style={{ color: '#237804' }} /><Text style={{ maxWidth: 200 }} ellipsis>{record.profile.address}</Text></Space>
          )}
          {!record.profile?.phone && !record.profile?.address && <Text type="secondary">-</Text>}
        </Space>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit User">
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              style={{ color: '#237804', borderColor: '#237804' }}
            />
          </Tooltip>
          <Popconfirm
            title="Hapus user?"
            description="Tindakan ini tidak dapat dibatalkan"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Tooltip title="Hapus User">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#111928', fontWeight: 700 }}>User Management</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Kelola user lokal aplikasi. Permission akses tetap berasal dari granular permission SSO Arnatech.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          style={{ backgroundColor: '#237804', borderColor: '#237804', borderRadius: 24, padding: '0 24px' }}
          onClick={() => showModal(null)}
        >
          Tambah User
        </Button>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
          <Input
            placeholder="Cari username atau email..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: 6 }}
            allowClear
          />
        </div>

        {isError && <Alert message="Gagal memuat data user" description={error?.message} type="error" banner />}

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loadingUsers}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {editingUser ? <EditOutlined style={{ color: '#237804' }} /> : <UserAddOutlined style={{ color: '#237804' }} />}
            <span>{editingUser ? 'Edit User' : 'Tambah User Baru'}</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{ style: { backgroundColor: '#237804', borderColor: '#237804' } }}
        centered
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Username wajib diisi' }]}>
                <Input placeholder="cth: budi_santoso" disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hak Akses">
                <Input value="Dikelola dari SSO Arnatech" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email tidak valid' }]}>
            <Input placeholder="cth: budi@example.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password wajib diisi' }]}>
              <Input.Password placeholder="Minimal 8 karakter" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item name="password" label="Password Baru (Opsional)" help="Kosongkan jika tidak ingin mengubah password">
              <Input.Password placeholder="Masukkan password baru" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}><Form.Item name="first_name" label="Nama Depan"><Input placeholder="Budi" /></Form.Item></Col>
            <Col span={12}><Form.Item name="last_name" label="Nama Belakang"><Input placeholder="Santoso" /></Form.Item></Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="No. Telepon">
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="0812..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="Alamat">
                <Input prefix={<HomeOutlined style={{ color: '#bfbfbf' }} />} placeholder="Jl. Sudirman No..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <UserManagementContent />
    </ProtectedRoute>
  );
}
