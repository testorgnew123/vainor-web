import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';

// Global auth state store to sync across all components
let globalAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
};

const listeners = new Set<() => void>();

function getAuthSnapshot(): AuthState {
  return globalAuthState;
}

function subscribeToAuth(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setGlobalAuthState(newState: AuthState | ((prev: AuthState) => AuthState)) {
  if (typeof newState === 'function') {
    globalAuthState = newState(globalAuthState);
  } else {
    globalAuthState = newState;
  }
  listeners.forEach(listener => listener());
}

// Initialize auth state from localStorage
function initializeAuth() {
  const storedToken = localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('auth_user');

  if (storedToken && storedUser) {
    try {
      const user = JSON.parse(storedUser);
      globalAuthState = {
        user,
        token: storedToken,
        isLoading: false,
      };
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      globalAuthState = { user: null, token: null, isLoading: false };
    }
  } else {
    globalAuthState = { user: null, token: null, isLoading: false };
  }
}

// Initialize on module load
initializeAuth();

export function updateAuthUser(updates: Partial<User>) {
  const current = globalAuthState;
  if (current.user) {
    const updatedUser = { ...current.user, ...updates };
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    setGlobalAuthState({ ...current, user: updatedUser });
  }
}

// Claim guest orders after login/signup (non-blocking, fire-and-forget)
async function claimGuestOrders(token: string, email: string) {
  try {
    await fetch(`${API_BASE}/claim-guest-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    // Non-fatal: don't break login/signup if claiming fails
  }
}

export function useAuth() {
  // Use useSyncExternalStore to subscribe to the global auth state
  const state = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthSnapshot);

  const signIn = useCallback(async (email: string, password: string) => {
    setGlobalAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Server returned invalid response. Make sure you are running "netlify dev".');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      setGlobalAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
      });

      // Claim any guest orders placed with this email
      claimGuestOrders(data.token, email);

      return { success: true };
    } catch (error) {
      setGlobalAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata: { first_name?: string; last_name?: string }
  ) => {
    setGlobalAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${API_BASE}/auth-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: metadata.first_name,
          last_name: metadata.last_name,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Server returned invalid response. Make sure you are running "netlify dev".');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      setGlobalAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
      });

      // Claim any guest orders placed with this email
      claimGuestOrders(data.token, email);

      return { success: true };
    } catch (error) {
      setGlobalAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setGlobalAuthState({ user: null, token: null, isLoading: false });
  }, []);

  // Memoize user object to prevent infinite re-renders in components that depend on user
  const user = useMemo(() => {
    if (!state.user) return null;
    return {
      id: state.user.id,
      email: state.user.email,
      user_metadata: {
        first_name: state.user.first_name,
        last_name: state.user.last_name,
      }
    };
  }, [state.user?.id, state.user?.email, state.user?.first_name, state.user?.last_name]);

  return {
    user,
    token: state.token,
    isLoading: state.isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin: false,
  };
}
