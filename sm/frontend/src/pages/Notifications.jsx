// pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notifAPI } from '../api';
import { ago } from '../utils/helpers';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notifAPI.getAll().then(r => { setNotifs(r.data.notifications); setUnread(r.data.unreadCount); }).finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await notifAPI.readAll();
    setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    setUnread(0);
    toast.success('All read');
  };

  return (
    <div style={{ maxWidth:640, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22 }}>Notifications {unread>0 && <span style={{ fontSize:14, color:'#6366f1' }}>({unread} new)</span>}</h1>
        {unread>0 && <button onClick={markAll} className="btn btn-secondary btn-sm">Mark all read</button>}
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        {loading ? <div style={{ display:'flex', justifyContent:'center', padding:32 }}><div className="spin" /></div>
        : notifs.length === 0 ? <div className="empty"><div className="empty-icon">🔔</div><h3>No notifications yet</h3></div>
        : notifs.map(n => (
          <div key={n._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: n.isRead ? '#fff':'#f0f4ff', borderBottom:'1px solid #f8fafc' }}>
            <Avatar user={n.sender} size={38} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13 }}>{n.message}</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{ago(n.createdAt)}</div>
            </div>
            {!n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'#6366f1', flexShrink:0 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
