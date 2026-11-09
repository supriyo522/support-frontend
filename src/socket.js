import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://support-backend-73f2.onrender.com'
);

export const connectSocket = (token) => {
  if (!token) return null;
  return io(SOCKET_URL, { auth: { token } });
};
