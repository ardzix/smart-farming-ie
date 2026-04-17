'use client';
import React, { useState } from 'react';
import { Card, Typography, Flex, Alert, Form, Input, Button, Divider, message } from 'antd';
import { GiSprout } from 'react-icons/gi';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useLogin, useSsoLogin, useMfaVerifyLogin } from '@/lib/hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import PasskeyLoginButton from '@/components/passkeys/PasskeyLoginButton';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState(null);

  const loginMutation = useLogin();
  const ssoLoginMutation = useSsoLogin();
  const mfaVerifyMutation = useMfaVerifyLogin();

  const handleFinish = (values) => {
    loginMutation.mutate({
      email: values.email,
      password: values.password
    }, {
      onSuccess: (response) => {
        const { mfa_required, pre_auth_token } = response.data;
        if (mfa_required) {
          setMfaRequired(true);
          setPreAuthToken(pre_auth_token);
        }
      }
    });
  };

  const handleMfaFinish = (values) => {
    mfaVerifyMutation.mutate({
      otp: values.otp,
      pre_auth_token: preAuthToken
    });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google login success, sending token to backend...');
    ssoLoginMutation.mutate({ token: credentialResponse.credential });
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    message.error('Terjadi kesalahan saat memuat atau otorisasi Google Login.');
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Flex vertical align="center" gap="middle" style={{ marginBottom: 32 }}>
          <GiSprout style={{ fontSize: '44px', color: '#237804' }} />
          <Title level={2} style={{ margin: 0 }}>Lahan Pintar</Title>
        </Flex>

        {!mfaRequired && (loginMutation.isError || ssoLoginMutation.isError) && (
          <Alert
            message="Login Gagal"
            description={
              loginMutation.error?.response?.data?.error || loginMutation.error?.message ||
              ssoLoginMutation.error?.response?.data?.error || ssoLoginMutation.error?.message ||
              'Terjadi kesalahan saat otentikasi.'
            }
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
        )}

        {!mfaRequired && (loginMutation.isSuccess || ssoLoginMutation.isSuccess) && !loginMutation.data?.data?.mfa_required && (
           <Alert
            message="Login Berhasil"
            description="Mengalihkan ke dashboard..."
            type="success"
            showIcon
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
        )}

        {mfaRequired ? (
          <Form
            name="mfaForm"
            layout="vertical"
            onFinish={handleMfaFinish}
            size="large"
            autoComplete="off"
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={4}>Verifikasi Dua Langkah (MFA)</Title>
              <Text type="secondary">Masukkan 6 digit kode dari aplikasi Authenticator Anda.</Text>
            </div>
            
            {(mfaVerifyMutation.isError) && (
              <Alert
                message="Verifikasi Gagal"
                description={mfaVerifyMutation.error?.response?.data?.message || mfaVerifyMutation.error?.response?.data?.error || 'Kode OTP tidak valid.'}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 24, textAlign: 'left' }}
              />
            )}

            <Form.Item
              name="otp"
              rules={[
                { required: true, message: 'Silakan masukkan kode OTP' },
                { len: 6, message: 'Kode OTP harus 6 digit' }
              ]}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
               <Input.OTP length={6} autoFocus />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={mfaVerifyMutation.isPending} style={{ background: '#237804', borderColor: '#237804', marginTop: 16 }}>
                Verifikasi
              </Button>
            </Form.Item>
            
            <Flex justify="center">
              <Button type="link" onClick={() => { setMfaRequired(false); setPreAuthToken(null); }} style={{ color: '#6B7280' }}>
                Kembali ke Login
              </Button>
            </Flex>
          </Form>
        ) : (
          <>
            <Form
              form={form}
              name="loginForm"
              layout="vertical"
              onFinish={handleFinish}
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'Silakan masukkan email Anda' }, { type: 'email', message: 'Format email tidak valid' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Silakan masukkan password Anda' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loginMutation.isPending} style={{ background: '#237804', borderColor: '#237804' }}>
                  Masuk
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Atau</Divider>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Flex justify="center" style={{ width: '100%' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  text="signin_with"
                />
              </Flex>
              {ssoLoginMutation.isPending && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>Mempersiapkan otentikasi...</Text>
              )}
            </div>
            <Flex justify="center" style={{ width: '100%' }}>
              <PasskeyLoginButton />
            </Flex>
          </>
        )}

        <Flex justify="center" style={{ marginTop: 16 }}>
          <Text>
            Belum punya akun? <Link href="/register" style={{ color: '#237804' }}>Daftar di sini</Link>
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}