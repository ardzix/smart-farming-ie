'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const getUserFromCookie = () => {
  try {
    const userCookie = Cookies.get('user');
    return userCookie ? JSON.parse(userCookie) : null;
  } catch (e) {
    console.error('Error parsing user cookie:', e);
    return null;
  }
};

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const user = getUserFromCookie();
      if (user) {
        router.replace('/admin');
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
