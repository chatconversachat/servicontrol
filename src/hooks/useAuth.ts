import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      if (existingUsers.some((u: any) => u.email === email)) {
        return { data: null, error: { message: 'User already exists' } };
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        password: btoa(password), // Simple encoding (NOT secure for production)
      };

      existingUsers.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(existingUsers));

      // Log user in
      const authUser = { id: newUser.id, email: newUser.email };
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      setUser(authUser);

      return { data: { user: authUser }, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('app_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === btoa(password));

      if (!user) {
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      const authUser = { id: user.id, email: user.email };
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      setUser(authUser);

      return { data: { user: authUser }, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_user');
      setUser(null);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

