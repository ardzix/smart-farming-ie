'use client';

import { GlobalOutlined } from '@ant-design/icons';
import { Select, Space, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';

const { Text } = Typography;

const options = [
  { value: 'en', labelKey: 'common.english' },
  { value: 'id', labelKey: 'common.indonesian' },
];

export default function LanguageSwitcher({ variant = 'inline', hideOnAdmin = false }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();

  if (hideOnAdmin && (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard'))) {
    return null;
  }

  const select = (
    <Select
      size="middle"
      value={locale}
      onChange={setLocale}
      style={{ minWidth: 148 }}
      options={options.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      }))}
    />
  );

  if (variant === 'floating') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid #E5E7EB',
          borderRadius: 999,
          padding: '8px 12px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Space size={8}>
          <GlobalOutlined />
          <Text>{t('common.language')}</Text>
          {select}
        </Space>
      </div>
    );
  }

  return (
    <Space size={8}>
      <GlobalOutlined />
      <Text>{t('common.language')}</Text>
      {select}
    </Space>
  );
}
