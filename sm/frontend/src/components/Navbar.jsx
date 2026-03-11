import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { searchAPI, notifAPI } from '../api';
import { ago, imgSrc } from '../utils/helpers';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

// ✏️ CHANGE YOUR SITE NAME HERE — updates everywhere automatically
const SITE_NAME = 'SocialMarket';
// To change the logo letter, edit the character inside the logo div below (search for "logo-letter")

export default function Navbar({ onNewPost }) {
  const { user, logout, isAuth } = useAuth();
  const nav = useNavigate();
  const [q, setQ]           = useState('');
  const [res, setRes]       = useState(null);
  const [tab, setTab]       = useState('users');
  const [busy, setBusy]     = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUser,   setShowUser]   = useState(false);
  const [showNotif,  setShowNotif]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const db = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!isAuth) return;
    notifAPI.getAll().then(r => { setNotifs(r.data.notifications.slice(0,8)); setUnread(r.data.unreadCount); }).catch(()=>{});
  }, [isAuth]);

  useEffect(() => {
    const close = e => {
      if (!searchRef.current?.contains(e.target)) setShowSearch(false);
      if (!e.target.closest('.nb-user'))   setShowUser(false);
      if (!e.target.closest('.nb-notif'))  setShowNotif(false);
      if (!e.target.closest('.nb-create')) setShowCreate(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = v => {
    setQ(v); clearTimeout(db.current);
    if (!v.trim()) { setShowSearch(false); setRes(null); return; }
    setShowSearch(true); setBusy(true);
    db.current = setTimeout(async () => {
      try { const r = await searchAPI.search(v); setRes(r.data); }
      catch {} finally { setBusy(false); }
    }, 400);
  };

  const go = path => { setShowSearch(false); setQ(''); nav(path); };

  const markAll = async () => {
    await notifAPI.readAll();
    setUnread(0); setNotifs(p => p.map(n => ({ ...n, isRead: true })));
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
        {/* logo-letter: change the letter below to match your site name */}
        <div style={{ width:34, height:34, background:'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Sora', fontWeight:800, fontSize:16 }}>
          {SITE_NAME[0]}
        </div>
        <span style={{ fontFamily:'Sora', fontWeight:800, fontSize:17, color:'#0f172a' }}>{SITE_NAME}</span>
      </Link>

      {/* Search */}
      <div ref={searchRef} style={{ flex:1, maxWidth:480, position:'relative' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:15 }}>🔍</span>
          <input className="inp" style={{ paddingLeft:34, borderRadius:99 }} placeholder="Search people, posts, services…"
            value={q} onChange={e => handleSearch(e.target.value)} />
        </div>
        {showSearch && (
          <div className="card fade" style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:300, overflow:'hidden' }}>
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
              {['users','posts','services'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'9px 0', fontSize:12, fontWeight:600, color: tab===t ? '#6366f1':'#94a3b8', background: tab===t ? '#f0f4ff':'#fff', borderBottom: tab===t ? '2px solid #6366f1':'2px solid transparent', cursor:'pointer', border:'none' }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)} {res ? `(${res[t]?.length||0})` : ''}
                </button>
              ))}
            </div>
            <div style={{ maxHeight:300, overflowY:'auto' }}>
              {busy && <div style={{ padding:14, textAlign:'center', color:'#94a3b8', fontSize:13 }}>Searching…</div>}
              {res && tab==='users' && (res.users.length===0 ? <Empty/> : res.users.map(u => (
                <button key={u._id} onClick={() => go(`/profile/${u._id}`)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'none', border:'none', cursor:'pointer' }}>
                  <Avatar user={u} size={32} />
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>@{u.username}</div>
                    <div style={{ color:'#94a3b8', fontSize:12 }}>{u.followersCount} followers</div>
                  </div>
                </button>
              )))}
              {res && tab==='posts' && (res.posts.length===0 ? <Empty/> : res.posts.map(p => (
                <button key={p._id} onClick={() => go(`/`)} style={{ width:'100%', display:'flex', gap:10, padding:'10px 14px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  <Avatar user={p.author} size={30} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12, color:'#64748b' }}>@{p.author?.username}</div>
                    <div className="clamp2" style={{ fontSize:13 }}>{p.content}</div>
                  </div>
                </button>
              )))}
              {res && tab==='services' && (res.services.length===0 ? <Empty/> : res.services.map(s => (
                <button key={s._id} onClick={() => go(`/services/${s._id}`)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'none', border:'none', cursor:'pointer' }}>
                  <div style={{ width:38, height:38, borderRadius:6, overflow:'hidden', flexShrink:0, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                    {s.images?.[0] ? <img src={imgSrc(s.images[0].url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '🛠️'}
                  </div>
                  <div style={{ textAlign:'left', minWidth:0 }}>
                    <div className="truncate" style={{ fontWeight:600, fontSize:13 }}>{s.title}</div>
                    <div style={{ color:'#94a3b8', fontSize:12 }}>{s.category} · ${s.price?.amount}</div>
                  </div>
                </button>
              )))}
            </div>
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        {isAuth ? (
          <>
            {/* Create */}
            <div className="nb-create" style={{ position:'relative' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(p=>!p)}>＋ Create</button>
              {showCreate && (
                <div className="card fade" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, minWidth:180, zIndex:300, overflow:'hidden' }}>
                  <DropItem icon="📝" label="New Post"    onClick={() => { onNewPost?.(); setShowCreate(false); }} />
                  <DropItem icon="🛠️" label="New Service" onClick={() => { nav('/services/create'); setShowCreate(false); }} />
                </div>
              )}
            </div>

            {/* Notifs */}
            <div className="nb-notif" style={{ position:'relative' }}>
              <button onClick={() => setShowNotif(p=>!p)} style={{ position:'relative', width:36, height:36, background:'#f8fafc', border:'1px solid var(--border)', borderRadius:8, fontSize:16, cursor:'pointer' }}>
                🔔{unread>0 && <span style={{ position:'absolute', top:5, right:5, width:7, height:7, background:'#ef4444', borderRadius:'50%', border:'1.5px solid #fff' }}/>}
              </button>
              {showNotif && (
                <div className="card fade" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, width:310, zIndex:300, overflow:'hidden' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontWeight:700 }}>Notifications</span>
                    {unread>0 && <button onClick={markAll} style={{ fontSize:12, color:'#6366f1', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>Mark all read</button>}
                  </div>
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {notifs.length===0 ? <div style={{ padding:20, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No notifications</div>
                    : notifs.map(n => (
                      <div key={n._id} style={{ display:'flex', gap:10, padding:'10px 14px', background: n.isRead ? '#fff':'#f0f4ff', borderBottom:'1px solid #f8fafc' }}>
                        <Avatar user={n.sender} size={30} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13 }}>{n.message}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{ago(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div style={{ width:7, height:7, borderRadius:'50%', background:'#6366f1', marginTop:5, flexShrink:0 }}/>}
                      </div>
                    ))}
                  </div>
                  <Link to="/notifications" onClick={() => setShowNotif(false)} style={{ display:'block', textAlign:'center', padding:'10px', fontSize:13, color:'#6366f1', fontWeight:600, borderTop:'1px solid var(--border)' }}>View all</Link>
                </div>
              )}
            </div>

            {/* User */}
            <div className="nb-user" style={{ position:'relative' }}>
              <button onClick={() => setShowUser(p=>!p)} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px 4px 4px', background:'#f8fafc', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer' }}>
                <Avatar user={user} size={28} />
                <span style={{ fontSize:13, fontWeight:600, maxWidth:80 }} className="truncate">{user?.username}</span>
                <span style={{ color:'#94a3b8', fontSize:11 }}>▾</span>
              </button>
              {showUser && (
                <div className="card fade" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, minWidth:200, zIndex:300, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:700 }}>@{user?.username}</div>
                    <div style={{ fontSize:12, color:'#94a3b8' }}>{user?.email}</div>
                  </div>
                  <DropItem icon="👤" label="Profile"  onClick={() => { nav(`/profile/${user?._id}`); setShowUser(false); }} />
                  <DropItem icon="💬" label="Messages" onClick={() => { nav('/messages'); setShowUser(false); }} />
                  <DropItem icon="⚙️" label="Settings" onClick={() => { nav('/settings'); setShowUser(false); }} />
                  {user?.role === 'admin' && <DropItem icon="🔑" label="Admin" color="#d97706" onClick={() => { nav('/admin'); setShowUser(false); }} />}
                  <hr className="divider" style={{ margin:'4px 0' }} />
                  <DropItem icon="🚪" label="Log Out" color="#dc2626" onClick={() => { logout(); toast.success('Logged out'); }} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login"    className="btn btn-secondary btn-sm">Log In</Link>
            <Link to="/register" className="btn btn-primary  btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const Empty = () => <div style={{ padding:14, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No results</div>;
const DropItem = ({ icon, label, onClick, color }) => (
  <button onClick={onClick} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:14, color: color||'#475569' }}>
    <span>{icon}</span>{label}
  </button>
);
