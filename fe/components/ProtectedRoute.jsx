'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { Spin } from 'antd';
import { useI18n } from '@/lib/i18n/I18nProvider';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    // 1. Load the user from cookies on first load/refresh
    initializeAuth();
    
    // Give the store 100ms to hydrate before deciding on redirects
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  useEffect(() => {
    // 2. Redirect logic should only run after the initial check finishes
    if (!isChecking) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, router, isChecking]);

  // 3. Show a clean loading state without Ant Design warnings
  if (isChecking || (!isAuthenticated && !user)) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Avoid the deprecated 'tip' prop warning */}
          <Spin size="large" /> 
          <span className="text-gray-500 font-medium mt-4">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
