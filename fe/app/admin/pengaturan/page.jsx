'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Form, Input, InputNumber, 
  Button, Switch, Divider, message, Spin, Alert, Space 
} from 'antd';
import { 
  SaveOutlined, SettingOutlined, BankOutlined, 
  SafetyCertificateOutlined, BellOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/lib/store/authStore';
import { getSettings, updateSettings } from '@/lib/api/settings';

const { Title, Text } = Typography;

const SectionTitle = ({ icon, title, description }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <div style={{ 
        width: '32px', height: '32px', borderRadius: '8px', 
        background: '#E1EFFE', color: '#1E429F', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' 
      }}>
        {icon}
      </div>
      <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111928' }}>
        {title}
      </Title>
    </div>
    <Text style={{ color: '#6B7280', fontSize: '14px', marginLeft: '44px', display: 'block' }}>
      {description}
    </Text>
  </div>
);

function SettingsContent() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  
  const canEdit = user?.role === 'Superadmin' || user?.role?.name === 'Superadmin';

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      message.success('Pengaturan berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => {
      message.error('Gagal menyimpan pengaturan');
    }
  });

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  const onFinish = (values) => {
    mutation.mutate(values);
  };

  if (isLoading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ fontSize: '30px', fontWeight: 700, color: '#111928', margin: 0, marginBottom: '6px' }}>
          Pengaturan Sistem
        </Title>
        <Text style={{ fontSize: '16px', color: '#6B7280' }}>
          Kelola konfigurasi global dan parameter saham perusahaan.
        </Text>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        disabled={!canEdit}
      >
        <Row gutter={[24, 24]}>
          
          {/* KOLOM KIRI: KONFIGURASI SAHAM (Disederhanakan) */}
          <Col xs={24} lg={14}>
            <Card 
              styles={{ body: { padding: '32px' } }}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                height: '100%'
              }}
            >
              <SectionTitle 
                icon={<BankOutlined />} 
                title="Konfigurasi Saham" 
                description="Tentukan jumlah total saham yang diterbitkan dan harga dasarnya." 
              />
              
              <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #F3F4F6' }}>
                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item 
                      label="Total Lembar Saham Perusahaan" 
                      name="total_shares"
                      rules={[{ required: true, message: 'Wajib diisi' }]}
                      tooltip="Total saham yang diterbitkan. Digunakan untuk menghitung persentase kepemilikan."
                      style={{ marginBottom: '24px' }}
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        size="large"
                        placeholder="Contoh: 10000"
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        suffix={<span style={{ color: '#6B7280' }}>Lembar</span>}
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={24}>
                    <Form.Item 
                      label="Harga Per Lembar Saham" 
                      name="share_price"
                      rules={[{ required: true, message: 'Wajib diisi' }]}
                      tooltip="Harga dasar per satu lembar saham."
                    >
                      <InputNumber 
                        style={{ width: '100%' }} 
                        size="large"
                        placeholder="Contoh: 1000000"
                        formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {!canEdit && (
                <Alert 
                  message="Akses Terbatas" 
                  description="Hanya Superadmin yang dapat mengubah konfigurasi ini." 
                  type="warning" 
                  showIcon 
                />
              )}

            </Card>
          </Col>

          {/* KOLOM KANAN: PROFIL & LAINNYA */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              
              <Card 
                styles={{ body: { padding: '24px' } }}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <SectionTitle 
                  icon={<SafetyCertificateOutlined />} 
                  title="Identitas Perusahaan" 
                  description="Informasi yang tampil di header laporan." 
                />
                
                <Form.Item label="Nama Perusahaan / Aplikasi" name="company_name">
                  <Input prefix={<SettingOutlined />} size="large" />
                </Form.Item>
                
                <Form.Item label="Email Support / Admin" name="support_email">
                  <Input size="large" />
                </Form.Item>
              </Card>

              <Card 
                styles={{ body: { padding: '24px' } }}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <SectionTitle 
                  icon={<BellOutlined />} 
                  title="Sistem" 
                  description="Preferensi notifikasi aplikasi." 
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>Aktifkan Notifikasi Email</Text>
                  <Form.Item name="enable_notifications" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Card>

            </Space>
          </Col>
        </Row>

        {canEdit && (
          <div style={{
            position: 'fixed',
            bottom: 0, right: 0, left: 0,
            padding: '16px 32px',
            background: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'flex-end',
            zIndex: 99
          }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={mutation.isPending}
              size="large"
              style={{ 
                background: '#237804', 
                borderColor: '#237804', 
                borderRadius: '8px',
                paddingLeft: '32px', paddingRight: '32px'
              }}
            >
              Simpan Perubahan
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <SettingsContent />
    </ProtectedRoute>
  );
}