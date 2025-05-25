import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/store/AuthContext';

// Singleton socket instance
let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const isConnectingRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CONNECTION_TIMEOUT = 10000; // 10 seconds

  const initializeSocket = useCallback(async () => {
    if (!token) {
      console.log('No token available, skipping connection');
      return;
    }

    if (socketInstance?.connected) {
      console.log('Socket already connected');
      setIsConnected(true);
      return;
    }

    if (isConnectingRef.current) {
      console.log('Connection already in progress');
      return;
    }

    try {
      console.log('Initializing socket connection...');
      isConnectingRef.current = true;
      setIsConnected(false);

      // Clear any existing timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      // Initialize socket connection
      socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: CONNECTION_TIMEOUT,
        forceNew: true
      });

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (!socketInstance?.connected) {
          console.log('Connection timeout reached');
          isConnectingRef.current = false;
          setIsConnected(false);
          if (socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
          }
        }
      }, CONNECTION_TIMEOUT);

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        isConnectingRef.current = false;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        // Attempt to reconnect after error
        if (socketInstance) {
          socketInstance.disconnect();
          socketInstance = null;
          setTimeout(() => initializeSocket(), 2000);
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
        // Attempt to reconnect if not disconnected intentionally
        if (reason !== 'io client disconnect' && socketInstance) {
          socketInstance.disconnect();
          socketInstance = null;
          setTimeout(() => initializeSocket(), 2000);
        }
      });

      // Add error event handler
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
      });

    } catch (error) {
      console.error('Error initializing socket:', error);
      isConnectingRef.current = false;
      setIsConnected(false);
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    }
  }, [token]);

  // Initialize socket connection when token changes
  useEffect(() => {
    if (token) {
      initializeSocket();
    }

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      isConnectingRef.current = false;
    };
  }, [token, initializeSocket]);

  const connect = useCallback(async () => {
    if (!token) {
      console.log('No token available, skipping connection');
      return;
    }

    if (!socketInstance) {
      await initializeSocket();
    }
  }, [token, initializeSocket]);

  const disconnect = useCallback(() => {
    if (socketInstance) {
      console.log('Disconnecting socket...');
      socketInstance.disconnect();
      socketInstance = null;
      setIsConnected(false);
      isConnectingRef.current = false;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    }
  }, []);

  return {
    socket: socketInstance,
    isConnected,
    connect,
    disconnect
  };
}; 