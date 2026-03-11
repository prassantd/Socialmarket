import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

export default function People() {
  const { isAuth } = useAuth();
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [q, setQ] = useState('');
  const db = useRef(null);

  useEffect(() => {
    const fn = isAuth ? userAPI.suggestions : () => Promise.resolve({ data: { users: [] } });
    fn().then(r => setUsers(r.data.users || r.data.suggestions || [])).catch(()=>{}).finally(() => setLoading(false));
  }, [isAuth]);

  const search = v => {
    setQ(v); clearTimeout(db.current);
    if (!v.trim()) {
      const fn = isAuth ? userAPI.suggestions : () => Promise.resolve({ data: { users: [] } });
      fn().then(r => setUsers(r.data.users || r.data.suggestions || [])).catch(()=>{});
      return;
    }
    db.current = setTimeout(async () => {
      try { const r = await userAPI.search(v); setUsers(r.data.users); }
      catch (e) { toast.error(errMsg(e)); }
    }, 400);
  };

  return (
    <div>
      <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22, marginBottom:4 }}>People</h1>
      <p style={{ color:'#94a3b8', fontSize:13, marginBottom:16 }}>Discover people to connect with</p>

      <div style={{ position:'relative', marginBottom:20 }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}>🔍</span>
        <input className="inp" style={{ paddingLeft:34 }} placeholder="Search by name or bio…" value={q} onChange={e=>search(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding:16, textAlign:'center' }}>
              <div className="skel av-fb" style={{ width:60, height:60, margin:'0 auto 10px' }} />
              <div className="skel" style={{ height:10, marginBottom:6 }} />
              <div className="skel" style={{ height:8, width:'60%', margin:'0 auto' }} />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card empty"><div className="empty-icon">👥</div><h3>No users found</h3><p>Try a different search</p></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {users.map(u => <UserCard key={u._id} user={u} />)}
        </div>
      )}
    </div>
  );
}

const UserCard = ({ user: u }) => {
  const { isAuth } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!isAuth) { toast.error('Login to follow'); return; }
    setBusy(true);
    try {
      if (following) { await userAPI.unfollow(u._id); setFollowing(false); }
      else           { await userAPI.follow(u._id);   setFollowing(true);  }
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ padding:16, textAlign:'center' }}>
      <Link to={`/profile/${u._id}`}><Avatar user={u} size={56} style={{ margin:'0 auto 10px' }} /></Link>
      <Link to={`/profile/${u._id}`} style={{ fontWeight:700, fontSize:13, display:'block', marginBottom:2 }}>@{u.username}</Link>
      {u.location && <div style={{ fontSize:11, color:'#94a3b8', marginBottom:2 }}>📍{u.location}</div>}
      <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>{u.followersCount} followers</div>
      <button onClick={toggle} disabled={busy} className={`btn btn-sm btn-full ${following ? 'btn-secondary' : 'btn-primary'}`}>
        {busy ? '…' : following ? 'Following' : '+ Follow'}
      </button>
    </div>
  );
};
