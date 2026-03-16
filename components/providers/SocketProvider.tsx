"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);

  // FIX: Initialize socket lazily inside useState.
  // This runs exactly once when the component mounts, avoiding the "cascading render" error.
  const [socket] = useState(() => {
    // Check if running on client-side to avoid SSR errors
    if (typeof window !== 'undefined') {
      return io("https://vaaratav-socket.onrender.com"); 
    }
    return null;
  });

  useEffect(() => {
    if (!socket) return;

    // Define event handlers
    const onConnect = () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Cleanup on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};