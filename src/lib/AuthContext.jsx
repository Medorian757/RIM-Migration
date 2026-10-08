import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';

import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] =
    useState(false);
  const [authError, setAuthError] = useState(null);

  // Keep this for compatibility with the existing RIM components.
  const [appPublicSettings] = useState({
    id: 'rim',
    public_settings: {},
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoadingAuth(true);
        setAuthError(null);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        const currentUser = session?.user ?? null;

        setUser(currentUser);
        setIsAuthenticated(Boolean(currentUser));
      } catch (error) {
        console.error('Supabase auth initialization failed:', error);

        if (!mounted) return;

        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: 'auth_error',
          message: error.message || 'Authentication failed',
        });
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
          setIsLoadingPublicSettings(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      setIsLoadingAuth(false);

      if (currentUser) {
        setAuthError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));

      return currentUser;
    } catch (error) {
      console.error('Auth check failed:', error);

      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_error',
        message: error.message || 'Authentication failed',
      });

      return null;
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);

      if (shouldRedirect) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);

      setAuthError({
        type: 'auth_error',
        message: error.message || 'Logout failed',
      });
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
