'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  joinedCommunities: JoinedCommunity[]; // Change this to array of JoinedCommunity
}

interface JoinedCommunity {
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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  const setAuth = useCallback((user: User, token: string) => {
    console.log('Setting auth:', { user, token }); // Debug log
    setState({
      user,
      token,
      isAuthenticated: true,
    });
    // Store in localStorage for persistence
    localStorage.setItem('auth', JSON.stringify({ user, token }));
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('auth');
  }, []);

  const addJoinedCommunity = (community: JoinedCommunity) => {
    setState(prev => {
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
    setState(prev => {
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

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      try {
        const { user, token } = JSON.parse(storedAuth);
        setState({
          user,
          token,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Error restoring auth state:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      token: state.token, 
      setAuth, 
      logout, 
      addJoinedCommunity,
      removeJoinedCommunity 
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
