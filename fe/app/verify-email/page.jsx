'use client';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Card, Typography, Flex, Alert, Button, message } from 'antd';
import { GiSprout } from 'react-icons/gi';
import { MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useVerifyEmail, useResendOtp } from '@/lib/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const { Title, Text } = Typography;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendOtp();

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current and focus previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      // Focus the next empty input or last one
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      e.preventDefault();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      message.warning('Masukkan 6 digit kode OTP.');
      return;
    }
    verifyMutation.mutate({ email: emailFromQuery, otp: otpString });
  };

  const handleResend = () => {
    if (!emailFromQuery) {
      message.error('Email tidak ditemukan.');
      return;
    }
    resendMutation.mutate({ email: emailFromQuery });
  };

  const otpComplete = otp.every(d => d !== '');

  const inputStyle = {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    border: '2px solid #d9d9d9',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Card style={{ width: 440, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Flex vertical align="center" gap="middle" style={{ marginBottom: 24 }}>
          <GiSprout style={{ fontSize: '44px', color: '#237804' }} />
          <Title level={3} style={{ margin: 0 }}>Verifikasi Email</Title>
        </Flex>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <MailOutlined style={{ fontSize: 48, color: '#237804', marginBottom: 12 }} />
          <Text style={{ display: 'block', marginBottom: 8 }}>
            Kami telah mengirimkan kode OTP 6-digit ke:
          </Text>
          <Text strong style={{ fontSize: 16 }}>
            {emailFromQuery || '(email tidak tersedia)'}
          </Text>
        </div>

        {verifyMutation.isError && (
          <Alert
            message="Verifikasi Gagal"
            description={
              verifyMutation.error?.response?.data?.error || 
              'Kode OTP tidak valid atau sudah kedaluwarsa.'
            }
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, textAlign: 'left' }}
          />
        )}

        {verifyMutation.isSuccess && (
          <Alert
            message="Email Terverifikasi!"
            description="Mengalihkan ke halaman login..."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 16, textAlign: 'left' }}
          />
        )}

        {/* OTP Input Boxes */}
        <Flex justify="center" gap={8} style={{ marginBottom: 24 }} onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              style={{
                ...inputStyle,
                borderColor: digit ? '#237804' : '#d9d9d9',
              }}
              onFocus={(e) => e.target.style.borderColor = '#237804'}
              onBlur={(e) => e.target.style.borderColor = digit ? '#237804' : '#d9d9d9'}
              disabled={verifyMutation.isPending || verifyMutation.isSuccess}
            />
          ))}
        </Flex>

        <Button
          type="primary"
          block
          size="large"
          onClick={handleVerify}
          loading={verifyMutation.isPending}
          disabled={!otpComplete || verifyMutation.isSuccess}
          style={{ background: '#237804', borderColor: '#237804', marginBottom: 16 }}
        >
          Verifikasi Email
        </Button>

        <Flex justify="center" align="center" gap={4} style={{ marginBottom: 16 }}>
          <Text type="secondary">Tidak menerima kode?</Text>
          <Button 
            type="link" 
            onClick={handleResend} 
            loading={resendMutation.isPending}
            style={{ color: '#237804', padding: 0 }}
          >
            Kirim Ulang OTP
          </Button>
        </Flex>

        <Flex justify="center">
          <Link href="/login" style={{ color: '#237804' }}>
            ← Kembali ke halaman Login
          </Link>
        </Flex>
      </Card>
    </Flex>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Flex align="center" justify="center" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <Text>Memuat...</Text>
      </Flex>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
