'use client';

import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import idID from 'antd/locale/id_ID';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AntdRenderProvider from './providers';
import QueryProvider from '@/lib/providers/QueryProvider';
import { I18nProvider, useI18n } from '@/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function AppProviders({ children }) {
  const { locale } = useI18n();
  const antLocale = locale === 'id' ? idID : enUS;

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENTID || ''}>
      <QueryProvider>
        <ConfigProvider locale={antLocale}>
          <AntdRenderProvider>
            <LanguageSwitcher variant="floating" hideOnAdmin />
            {children}
          </AntdRenderProvider>
        </ConfigProvider>
      </QueryProvider>
    </GoogleOAuthProvider>
  );
}

export default function RootProviders({ children }) {
  return (
    <I18nProvider>
      <AppProviders>{children}</AppProviders>
    </I18nProvider>
  );
}
