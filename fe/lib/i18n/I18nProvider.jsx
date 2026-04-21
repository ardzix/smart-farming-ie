'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import axiosClient from '@/lib/api/axiosClient';
import { messages, supportedLocales } from '@/lib/i18n/messages';

const DEFAULT_LOCALE = 'id';
const STORAGE_KEY = 'app_locale';

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => fallback ?? key,
});

function resolveMessage(locale, key) {
  return key.split('.').reduce((value, part) => value?.[part], messages[locale]);
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const savedLocale =
      Cookies.get(STORAGE_KEY) ||
      Cookies.get('django_language') ||
      (typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null) ||
      DEFAULT_LOCALE;

    if (supportedLocales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  useEffect(() => {
    if (!supportedLocales.includes(locale)) return;

    Cookies.set(STORAGE_KEY, locale, { expires: 365, path: '/' });
    Cookies.set('django_language', locale, { expires: 365, path: '/' });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }

    axiosClient.defaults.headers.common['Accept-Language'] = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        if (supportedLocales.includes(nextLocale)) {
          setLocaleState(nextLocale);
        }
      },
      t: (key, fallback) => resolveMessage(locale, key) ?? fallback ?? key,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
