import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(() => { try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sm_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(r => { setUser(r.data.user); localStorage.setItem('sm_user', JSON.stringify(r.data.user)); })
      .catch(() => { localStorage.clear(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password });
    localStorage.setItem('sm_token', r.data.token);
    localStorage.setItem('sm_user',  JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (username, email, password) => {
    const r = await authAPI.register({ username, email, password });
    localStorage.setItem('sm_token', r.data.token);
    localStorage.setItem('sm_user',  JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => { localStorage.clear(); setUser(null); };

  const refresh = (u) => { setUser(u); localStorage.setItem('sm_user', JSON.stringify(u)); };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh, isAuth: !!user }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
