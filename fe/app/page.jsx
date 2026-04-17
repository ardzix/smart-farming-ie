// faizulhq/lahan-pintar2/LAHAN-PINTAR2-dfe2664682ace9537893ea0569b86e928b07e701/app/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const getRoleFromCookie = () => {
  try {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      return userData.role || null;
    }
    return null;
  } catch (e) {
    console.error('❌ Error parsing user cookie:', e);
    return null;
  }
};

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const userRole = getRoleFromCookie();
      console.log('🏠 Home page - User role:', userRole);
      
      if (userRole) {
        // --- PERUBAHAN DI SINI ---
        if (userRole === 'Admin' || userRole === 'Superadmin' || userRole === 'Operator') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
        // --- BATAS PERUBAHAN ---
      } else {
        router.replace('/login');
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return null;
}