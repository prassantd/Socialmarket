import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';

const LINKS = [
  { to:'/', icon:'🏠', label:'Feed', auth:true },
  { to:'/explore', icon:'🔭', label:'Explore', auth:false },
  { to:'/people',  icon:'👥', label:'People',  auth:false },
  { to:'/services',icon:'🛠️', label:'Services', auth:false },
  { to:'/messages',icon:'💬', label:'Messages', auth:true },
  { to:'/notifications', icon:'🔔', label:'Notifications', auth:true },
];

export default function Sidebar() {
  const { user, isAuth } = useAuth();
  return (
    <aside className="sidebar" style={{ position:'sticky', top:76, height:'fit-content' }}>
      {isAuth && (
        <div className="card" style={{ padding:14, marginBottom:12, textAlign:'center' }}>
          <NavLink to={`/profile/${user?._id}`}>
            <Avatar user={user} size={52} style={{ margin:'0 auto 8px' }} />
          </NavLink>
          <div style={{ fontWeight:700, fontSize:14 }}>@{user?.username}</div>
          <div style={{ color:'#94a3b8', fontSize:12, marginTop:2 }}>{user?.bio?.slice(0,50) || 'No bio yet'}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:10, fontSize:12 }}>
            <div><span style={{ fontWeight:700 }}>{user?.followersCount}</span><div style={{ color:'#94a3b8' }}>Followers</div></div>
            <div><span style={{ fontWeight:700 }}>{user?.followingCount}</span><div style={{ color:'#94a3b8' }}>Following</div></div>
          </div>
        </div>
      )}
      <div className="card" style={{ padding:8 }}>
        {LINKS.filter(l => !l.auth || isAuth).map(l => (
          <NavLink key={l.to} to={l.to} end={l.to==='/'} className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}>
            <span>{l.icon}</span>{l.label}
          </NavLink>
        ))}
        {isAuth && (
          <NavLink to="/settings" className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}>
            <span>⚙️</span>Settings
          </NavLink>
        )}
      </div>
    </aside>
  );
}
