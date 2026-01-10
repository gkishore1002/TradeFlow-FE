// src/hooks/useAuth.js

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Custom hook for authentication
 * Manages user state and provides logout functionality
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      setLoading(false);
      return;
    }

    // Load user data from localStorage
    const email = localStorage.getItem('email');
    const firstName = localStorage.getItem('first_name');
    const lastName = localStorage.getItem('last_name');
    const userId = localStorage.getItem('user_id');
    const avatarUrl = localStorage.getItem('avatar_url');

    setUser({
      email,
      firstName,
      lastName,
      userId,
      avatarUrl,
    });
    setLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('email');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('avatar_url');
    router.push('/login');
  };

  return { user, loading, logout };
}
