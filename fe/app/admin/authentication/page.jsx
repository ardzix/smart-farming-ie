'use client';

import React, { useState } from 'react';
import { Card, Typography, Spin, Alert, Button, Input, Form, message, Modal, Flex, Space, Divider, Skeleton } from 'antd';
import { SafetyCertificateOutlined, CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getMfaStatus } from '@/lib/api/auth';
import { useMfaSetup, useMfaVerifySetup, useMfaDisable } from '@/lib/hooks/useAuth';
import useAuthStore from '@/lib/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import PasskeySettingsContainer from '@/components/passkeys/PasskeySettingsContainer';

const { Title, Text } = Typography;

function AuthenticationSettings() {
  const user = useAuthStore((state) => state.user);
  
  const [setupData, setSetupData] = useState(null);
  const [setupMode, setSetupMode] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  
  const [verifyForm] = Form.useForm();
  const [disableForm] = Form.useForm();

  const { data: statusRes, isLoading: loadingStatus } = useQuery({
    queryKey: ['mfaStatus'],
    queryFn: getMfaStatus,
    retry: false,
    staleTime: 30000,
  });

  const setupMutation = useMfaSetup();
  const verifySetupMutation = useMfaVerifySetup();
  const disableMutation = useMfaDisable();

  const mfaEnabled = statusRes?.data?.is_mfa_enabled || statusRes?.data?.mfa_enabled || false;

  const handleStartSetup = () => {
    setSetupMode(true);
    setupMutation.mutate(undefined, {
      onSuccess: (res) => {
        setSetupData(res.data);
      },
      onError: (err) => {
        message.error("Gagal memuat QR Code MFA.");
        setSetupMode(false);
      }
    });
  };

  const handleVerifySetup = (values) => {
    verifySetupMutation.mutate({ otp: values.otp }, {
      onSuccess: () => {
        setSetupMode(false);
        setSetupData(null);
        verifyForm.resetFields();
      }
    });
  };

  const handleDisable = (values) => {
    disableMutation.mutate({
      password: values.password,
      otp: values.totp || values.otp
    }, {
      onSuccess: () => {
        setDisableModalOpen(false);
        disableForm.resetFields();
      }
    });
  };

  if (loadingStatus) {
    return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large"><div style={{ padding: 30 }}>Memuat status MFA...</div></Spin></div>;
  }

  return (
    <Card 
      styles={{ body: { padding: '32px' } }}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        marginTop: 0,
        marginBottom: 20
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '8px', 
            background: '#FDF6B2', color: '#8A2C0D', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' 
          }}>
            <SafetyCertificateOutlined />
          </div>
          <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111928' }}>
            Keamanan Akun (MFA)
          </Title>
        </div>
        <Text style={{ color: '#6B7280', fontSize: '14px', marginLeft: '44px', display: 'block' }}>
          Tingkatkan keamanan akun Anda dengan Verifikasi Dua Langkah (TOTP).
        </Text>
      </div>

      {mfaEnabled ? (
        <Alert 
          message="MFA Aktif" 
          description="Akun Anda saat ini dilindungi oleh Verifikasi Dua Langkah (TOTP). Anda akan diminta memasukkan kode verifikasi setiap kali login." 
          type="success"
          icon={<CheckCircleFilled />}
          showIcon
          action={
            <Button danger onClick={() => setDisableModalOpen(true)}>
              Nonaktifkan MFA
            </Button>
          }
        />
      ) : (
        <>
          {!setupMode ? (
            <Alert 
              message="MFA Tidak Aktif" 
              description="Sangat disarankan untuk mengaktifkan Verifikasi Dua Langkah agar akun Anda lebih aman." 
              type="warning" 
              showIcon 
              action={
                <Button type="primary" onClick={handleStartSetup} style={{ background: '#237804', borderColor: '#237804' }}>
                  Generate MFA
                </Button>
              }
            />
          ) : (
            <div style={{ border: '1px solid #E5E7EB', padding: 24, borderRadius: 12, background: '#F9FAFB' }}>
              <Title level={5} style={{ marginTop: 0 }}>Setup OTP Authenticator</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Ikuti langkah-langkah di bawah ini untuk mengaktifkan autentikasi dua faktor:
              </Text>
              
              <Flex gap={40} align="flex-start" wrap="wrap">
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>1. Scan QR Code</Text>
                  <Card size="small" style={{ width: 220, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {setupMutation.isPending || !setupData ? (
                      <Spin style={{ padding: 40 }}><div style={{ marginTop: 10, fontSize: 12 }}>Memuat...</div></Spin>
                    ) : (
                      <>
                        {/* Deteksi jika data adalah HTML/SVG atau sekadar URI string */}
                        {(setupData.qr_code?.startsWith('<') || setupData.qr_code_url?.startsWith('<')) ? (
                          <div 
                            dangerouslySetInnerHTML={{ __html: setupData.qr_code_url || setupData.qr_code }} 
                            style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }} 
                          />
                        ) : (
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_code_url || setupData.qr_code || setupData.otpauth_url || `otpauth://totp/LahanPintar:${user?.email}?secret=${setupData.secret}&issuer=LahanPintar`)}`} 
                            alt="QR Code" 
                            style={{ width: '100%', display: 'block' }}
                          />
                        )}
                      </>
                    )}
                  </Card>
                </div>

                <div style={{ flex: 1, minWidth: 280 }}>
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>2. Masukkan Secret Key Manual (Opsional)</Text>
                  {setupData?.secret ? (
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #d9d9d9', marginBottom: 24 }}>
                       <Flex justify="space-between" align="center">
                          <Text code style={{ fontSize: 16, letterSpacing: 1, background: 'transparent', border: 'none' }}>{setupData.secret}</Text>
                          <Button 
                            type="text"
                            icon={<CopyOutlined />} 
                            onClick={() => {
                              navigator.clipboard.writeText(setupData.secret);
                              message.success("Secret key disalin ke clipboard!");
                            }} 
                          />
                       </Flex>
                    </div>
                  ) : (
                    <Skeleton.Button active block style={{ marginBottom: 24, height: 48 }} />
                  )}
                  
                  <Divider style={{ margin: '24px 0' }} />

                  <Text strong style={{ display: 'block', marginBottom: 12 }}>3. Verifikasi Kode OTP</Text>
                  <Form form={verifyForm} layout="vertical" onFinish={handleVerifySetup}>
                    <Form.Item 
                      label="Masukkan 6 digit kode dari aplikasi authenticator Anda" 
                      name="otp"
                      rules={[{ required: true, message: 'Silakan masukkan kode OTP' }, { len: 6, message: 'Kode OTP harus 6 digit' }]}
                    >
                      <Input.OTP length={6} autoFocus />
                    </Form.Item>
                    <Space size="middle" style={{ marginTop: 8 }}>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={verifySetupMutation.isPending}
                        style={{ background: '#237804', borderColor: '#237804', height: 40, padding: '0 24px' }}
                      >
                        Verifikasi & Aktifkan
                      </Button>
                      <Button 
                        onClick={() => { setSetupMode(false); setSetupData(null); verifyForm.resetFields(); }}
                        style={{ height: 40 }}
                      >
                        Batal
                      </Button>
                    </Space>
                  </Form>
                </div>
              </Flex>
            </div>
          )}
        </>
      )}

      {/* Modal Disable MFA */}
      <Modal
        title="Nonaktifkan MFA"
        open={disableModalOpen}
        onCancel={() => {
          disableForm.resetFields();
          setDisableModalOpen(false);
        }}
        footer={null}
      >
        <Alert message="Peringatan" description="Menonaktifkan MFA akan menurunkan tingkat keamanan akun Anda." type="warning" showIcon style={{ marginBottom: 16 }} />
        
        <Form form={disableForm} layout="vertical" onFinish={handleDisable}>
          <Form.Item 
            name="password" 
            label="Password Anda" 
            extra="Bisa dikosongkan jika menggunakan kode OTP"
            rules={[{ required: false }]}
          >
            <Input.Password placeholder="Masukkan password akun Anda" />
          </Form.Item>
          <Form.Item 
            name="otp" 
            label="Kode OTP saat ini" 
            extra="Bisa dikosongkan jika menggunakan Password"
            rules={[{ required: false }, { len: 6, message: 'OTP mesti 6 digit' }]}
          >
            <Input.OTP length={6} autoFocus />
          </Form.Item>
          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setDisableModalOpen(false)}>Batal</Button>
            <Button type="primary" danger htmlType="submit" loading={disableMutation.isPending}>
              Nonaktifkan MFA
            </Button>
          </Flex>
        </Form>
      </Modal>

    </Card>
  );
}

export default function AuthenticationPage() {
  return (
    <ProtectedRoute roles={['Superadmin', 'Admin', 'Investor', 'Viewer']}>
      <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ fontSize: '30px', fontWeight: 700, color: '#111928', margin: 0, marginBottom: '6px' }}>
            Authentication & Security
          </Title>
          <Text style={{ fontSize: '16px', color: '#6B7280' }}>
            Kelola pengaturan keamanan akun Anda termasuk autentikasi dua faktor.
          </Text>
        </div>
        <AuthenticationSettings />
        <PasskeySettingsContainer />
      </div>
    </ProtectedRoute>
  );
}
