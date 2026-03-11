import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

let _socket = null;

export const useSocket = () => {
  const { user } = useAuth();
  const ref = useRef(null);

  useEffect(() => {
    if (user && !_socket) {
      _socket = io(' https://socialmarket-backend.onrender.com', { transports: ['websocket'] });
      _socket.on('connect', () => _socket.emit('user:online', user._id));
      ref.current = _socket;
    }
    if (!user && _socket) {
      _socket.disconnect();
      _socket = null;
      ref.current = null;
    }
    return () => {};
  }, [user]);

  const emit = useCallback((e, d) => { ref.current?.emit(e, d); }, []);
  const on   = useCallback((e, cb) => { ref.current?.on(e, cb); }, []);
  const off  = useCallback((e, cb) => { ref.current?.off(e, cb); }, []);
  return { emit, on, off };
};
