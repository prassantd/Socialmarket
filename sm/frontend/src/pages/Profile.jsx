import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI, postAPI, svcAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import PostCard from '../components/PostCard';
import ServiceCard from '../components/ServiceCard';
import Avatar from '../components/Avatar';
import { fmt, imgSrc } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const { user: me, isAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts,   setPosts]   = useState([]);
  const [services, setServices] = useState([]);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState('Posts');
  const [loading, setLoading] = useState(true);

  const isMe = me?._id === id;

  useEffect(() => {
    setLoading(true);
    Promise.all([userAPI.get(id), postAPI.userPosts(id), svcAPI.byUser(id)])
      .then(([ur, pr, sr]) => {
        setProfile(ur.data.user);
        setFollowing(ur.data.isFollowing);
        setPosts(pr.data.posts);
        setServices(sr.data.services);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFollow = async () => {
    if (!isAuth) { toast.error('Login to follow'); return; }
    try {
      if (following) { await userAPI.unfollow(id); setFollowing(false); setProfile(p => ({ ...p, followersCount: p.followersCount - 1 })); }
      else           { await userAPI.follow(id);   setFollowing(true);  setProfile(p => ({ ...p, followersCount: p.followersCount + 1 })); }
    } catch (e) { toast.error(errMsg(e)); }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spin" /></div>;
  if (!profile) return <div className="card empty"><div className="empty-icon">👤</div><h3>User not found</h3></div>;

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ padding:0, marginBottom:14, overflow:'hidden' }}>
        <div style={{ height:120, background:'linear-gradient(135deg,#6366f1,#818cf8)' }} />
        <div style={{ padding:'0 20px 20px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ marginTop:-36 }}>
              <Avatar user={profile} size={72} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {isMe ? (
                <Link to="/settings" className="btn btn-secondary btn-sm">✏️ Edit Profile</Link>
              ) : (
                <>
                  <button onClick={toggleFollow} className={`btn btn-sm ${following ? 'btn-secondary' : 'btn-primary'}`}>
                    {following ? 'Following' : '+ Follow'}
                  </button>
                  <Link to={`/messages?user=${id}`} className="btn btn-secondary btn-sm">💬 Message</Link>
                </>
              )}
            </div>
          </div>
          <h1 style={{ fontWeight:800, fontSize:18 }}>@{profile.username}</h1>
          {profile.bio && <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>{profile.bio}</p>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:8, fontSize:13, color:'#94a3b8' }}>
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.website  && <a href={profile.website} target="_blank" rel="noreferrer" style={{ color:'#6366f1' }}>🔗 Website</a>}
            <span>📅 Joined {fmt(profile.createdAt)}</span>
          </div>
          <div style={{ display:'flex', gap:20, marginTop:12, fontSize:13 }}>
            <div><strong>{profile.followersCount}</strong> <span style={{ color:'#94a3b8' }}>Followers</span></div>
            <div><strong>{profile.followingCount}</strong> <span style={{ color:'#94a3b8' }}>Following</span></div>
            <div><strong>{posts.length}</strong> <span style={{ color:'#94a3b8' }}>Posts</span></div>
            <div><strong>{services.length}</strong> <span style={{ color:'#94a3b8' }}>Services</span></div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display:'flex', borderTop:'1px solid var(--border)' }}>
          {['Posts','Services'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'11px 0', fontSize:13, fontWeight:700, background:'none', border:'none', borderBottom: tab===t ? '2px solid #6366f1':'2px solid transparent', color: tab===t ? '#6366f1':'#94a3b8', cursor:'pointer' }}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'Posts' && (
        posts.length === 0
          ? <div className="card empty"><div className="empty-icon">📭</div><h3>No posts yet</h3></div>
          : posts.map(p => <PostCard key={p._id} post={p} onDelete={pid => setPosts(prev => prev.filter(x=>x._id!==pid))} />)
      )}

      {tab === 'Services' && (
        services.length === 0
          ? <div className="card empty"><div className="empty-icon">🛠️</div><h3>No services listed</h3>{isMe && <Link to="/services/create" className="btn btn-primary btn-sm" style={{ marginTop:10 }}>+ List Service</Link>}</div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>{services.map(s => <ServiceCard key={s._id} service={s} />)}</div>
      )}
    </div>
  );
}
