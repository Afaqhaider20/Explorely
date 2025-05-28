'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  joinedCommunities: JoinedCommunity[]; // Change this to array of JoinedCommunity
  location?: {
    city: string;
    country: string;
  };
}

export interface JoinedCommunity {
  _id: string;
  name: string;
  avatar: string;
  description: string;
  rules: {
    order: number;
    content: string;
    _id: string;
    createdAt: string;
  }[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  addJoinedCommunity: (community: JoinedCommunity) => void;
  removeJoinedCommunity: (communityId: string) => void;
  isInitialized: boolean;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
  updateUserLocation: () => Promise<void>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,
  });

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    // Remove token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      // Check if we have a token before attempting refresh
      if (!authState.token) {
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired, logout user
          logout();
          return;
        }
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.token) {
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        auth.token = data.token;
        localStorage.setItem('auth', JSON.stringify(auth));
        document.cookie = `token=${data.token}; path=/; SameSite=Lax`;
        
        setAuthState(prev => ({
          ...prev,
          token: data.token
        }));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Only logout if it's a critical error
      if (error instanceof Error && error.message.includes('Failed to refresh token')) {
        logout();
      }
    }
  }, [authState.token, logout]);

  const updateUserLocation = useCallback(async () => {
    try {
      console.log('Attempting to fetch user location...');
      const response = await fetch('https://ipinfo.io/json');
      const data = await response.json();
      
      if (data.city && data.country) {
        console.log('Location updated successfully:', { city: data.city, country: data.country });
        setAuthState(prev => {
          if (!prev.user) return prev;
          
          const updatedUser = {
            ...prev.user,
            location: {
              city: data.city,
              country: data.country // This will be the country code (e.g., "PK")
            }
          };

          // Update localStorage
          localStorage.setItem('auth', JSON.stringify({
            user: updatedUser,
            token: prev.token
          }));

          return {
            ...prev,
            user: updatedUser
          };
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  }, []);

  useEffect(() => {
    console.log('Initializing auth state...');
    // Check for token in localStorage on mount
    const storedAuth = localStorage.getItem('auth');
    console.log('Stored auth:', storedAuth);
    
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        console.log('Parsed auth:', parsedAuth);
        
        // Store token in cookie for middleware access with 1 day expiration
        document.cookie = `token=${parsedAuth.token}; path=/; SameSite=Lax; max-age=86400`;
        
        // If user is authenticated but doesn't have location, fetch it
        if (parsedAuth.user && !parsedAuth.user.location) {
          updateUserLocation();
        }
        
        setAuthState({
          user: parsedAuth.user,
          token: parsedAuth.token,
          isAuthenticated: true,
          isInitialized: true,
        });

        // Set up token refresh with debouncing
        let refreshTimeout: NodeJS.Timeout;
        const checkTokenExpiration = async () => {
          // Clear any existing timeout
          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
          }

          // Set a new timeout to refresh token after 5 minutes of inactivity
          refreshTimeout = setTimeout(async () => {
            try {
              await refreshToken();
            } catch (error) {
              console.error('Error in token refresh timeout:', error);
            }
          }, 5 * 60 * 1000); // 5 minutes
        };

        // Add event listeners for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
          window.addEventListener(event, checkTokenExpiration);
        });

        // Initial token refresh check
        checkTokenExpiration();

        return () => {
          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
          }
          events.forEach(event => {
            window.removeEventListener(event, checkTokenExpiration);
          });
        };
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        localStorage.removeItem('auth');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true,
      });
    }
  }, [refreshToken, updateUserLocation]);

  const setAuth = (user: User, token: string) => {
    const authData = { user, token };
    localStorage.setItem('auth', JSON.stringify(authData));
    // Store token in cookie for middleware access
    document.cookie = `token=${token}; path=/; SameSite=Lax`;
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isInitialized: true,
    });
  };

  const addJoinedCommunity = (community: JoinedCommunity) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      
      // Check if community already exists
      const communityExists = prev.user.joinedCommunities?.some(c => c._id === community._id);
      if (communityExists) return prev;

      // Add new community
      const updatedUser = {
        ...prev.user,
        joinedCommunities: [
          ...(prev.user.joinedCommunities || []),
          community
        ]
      };

      // Update localStorage
      localStorage.setItem('auth', JSON.stringify({
        user: updatedUser,
        token: prev.token
      }));

      return {
        ...prev,
        user: updatedUser
      };
    });
  };

  const removeJoinedCommunity = (communityId: string) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      
      // Filter out the community with the matching id
      const updatedJoinedCommunities = prev.user.joinedCommunities?.filter(
        c => c._id !== communityId
      ) || [];
      
      const updatedUser = {
        ...prev.user,
        joinedCommunities: updatedJoinedCommunities
      };

      // Update localStorage
      localStorage.setItem('auth', JSON.stringify({
        user: updatedUser,
        token: prev.token
      }));

      return {
        ...prev,
        user: updatedUser
      };
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user: authState.user, 
      token: authState.token, 
      setAuth, 
      logout, 
      addJoinedCommunity,
      removeJoinedCommunity,
      isInitialized: authState.isInitialized,
      isAuthenticated: authState.isAuthenticated,
      refreshToken,
      updateUserLocation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
