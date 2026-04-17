'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 1. Load data user dari Cookie saat pertama kali buka/refresh
    initializeAuth();
    
    // Beri waktu 100ms agar state store terisi sebelum memutuskan redirect
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  useEffect(() => {
    // 2. Logika Redirect hanya jalan setelah checking selesai
    if (!isChecking) {
      if (!isAuthenticated || !user) {
        router.push('/login');
      } else if (roles) {
        const userRole = user.role?.name || user.role;
        if (!roles.includes(userRole)) {
          router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, roles, router, isChecking]);

  // 3. Tampilkan Loading Bersih (Tanpa Warning Antd)
  if (isChecking || (!isAuthenticated && !user)) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Hapus prop 'tip' agar tidak warning */}
          <Spin size="large" /> 
          <span className="text-gray-500 font-medium mt-4">Memuat data...</span>
        </div>
      </div>
    );
  }

  // 4. Return Null jika user ada tapi role salah (menunggu redirect)
  if (roles && user) {
    const userRole = user.role?.name || user.role;
    if (!roles.includes(userRole)) {
      return null;
    }
  }

  return children;
};

export default ProtectedRoute;