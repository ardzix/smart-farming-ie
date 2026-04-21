'use client';
import React from 'react';
import { Card, Typography, Flex, Alert, Form, Input, Button, Divider, message } from 'antd';
import { GiSprout } from 'react-icons/gi';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useRegister, useSsoLogin } from '@/lib/hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/I18nProvider';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const registerMutation = useRegister();
  const ssoLoginMutation = useSsoLogin();

  const handleFinish = (values) => {
    registerMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google login success, sending token to backend...');
    ssoLoginMutation.mutate({ token: credentialResponse.credential });
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    message.error(t('auth.googleAuthError'));
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Flex vertical align="center" gap="middle" style={{ marginBottom: 32 }}>
          <GiSprout style={{ fontSize: '44px', color: '#237804' }} />
          <Title level={2} style={{ margin: 0 }}>
            {t('auth.signUp')}
          </Title>
        </Flex>

        {(registerMutation.isError || ssoLoginMutation.isError) && (
          <Alert
            message={t('auth.registrationFailed')}
            description={
              registerMutation.error?.response?.data?.error ||
              registerMutation.error?.message ||
              ssoLoginMutation.error?.response?.data?.error ||
              ssoLoginMutation.error?.message ||
              t('auth.registrationError')
            }
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
        )}

        {(registerMutation.isSuccess || ssoLoginMutation.isSuccess) && (
          <Alert
            message={t('auth.registrationSuccess')}
            description={t('auth.redirectingToDashboard')}
            type="success"
            showIcon
            style={{ marginBottom: 24, textAlign: 'left' }}
          />
        )}

        <Form form={form} name="registerForm" layout="vertical" onFinish={handleFinish} size="large" autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('auth.enterEmail') },
              { type: 'email', message: t('auth.invalidEmail') },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={t('auth.email')} />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: t('auth.enterPassword') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={registerMutation.isPending} style={{ background: '#237804', borderColor: '#237804' }}>
              {t('auth.signUp')}
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>{t('auth.signUpWith')}</Divider>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Flex justify="center" style={{ width: '100%' }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_black" shape="pill" text="signup_with" />
          </Flex>
          {ssoLoginMutation.isPending && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {t('auth.preparingAuth')}
            </Text>
          )}
        </div>

        <Flex justify="center" style={{ marginTop: 16 }}>
          <Text>
            {t('auth.alreadyHaveAccount')} <Link href="/login" style={{ color: '#237804' }}>{t('auth.signInHere')}</Link>
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}
