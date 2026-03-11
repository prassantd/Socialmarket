import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { postAPI, errMsg } from '../api';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

export default function Feed({ showCreate, setShowCreate }) {
  const { user, isAuth } = useAuth();
  const [posts, setPosts]   = useState([]);
  const [page,  setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pg = 1, reset = false) => {
    setLoading(true);
    try {
      const fn = isAuth ? postAPI.feed : postAPI.explore;
      const r  = await fn({ page: pg });
      const newPosts = r.data.posts;
      setPosts(p => reset ? newPosts : [...p, ...newPosts]);
      setHasMore(r.data.hasMore);
      setPage(pg);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  }, [isAuth]);

  useEffect(() => { load(1, true); }, [load]);

  const onCreated = (post) => { setPosts(p => [post, ...p]); setShowCreate(false); };
  const onDelete  = (id)   => setPosts(p => p.filter(x => x._id !== id));

  return (
    <div>
      {/* Create post prompt */}
      {isAuth && (
        <div className="card" style={{ padding:14, marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
          <Avatar user={user} size={38} />
          <button onClick={() => setShowCreate(true)} style={{ flex:1, textAlign:'left', padding:'9px 14px', background:'#f8fafc', border:'1.5px solid var(--border)', borderRadius:99, color:'#94a3b8', fontSize:14, cursor:'pointer' }}>
            What's on your mind, {user?.username?.split(' ')[0]}?
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">Post</button>
        </div>
      )}

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <SkeletonPost key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="card empty" style={{ marginTop:12 }}>
          <div className="empty-icon">📭</div>
          <h3>{isAuth ? 'Your feed is empty' : 'No posts yet'}</h3>
          <p>{isAuth ? 'Follow people to see their posts here' : 'Be the first to post!'}</p>
        </div>
      ) : (
        <>
          {posts.map(p => <PostCard key={p._id} post={p} onDelete={onDelete} />)}
          {hasMore && (
            <button onClick={() => load(page + 1)} disabled={loading} className="btn btn-secondary btn-full" style={{ marginTop:8 }}>
              {loading ? 'Loading…' : 'Load More'}
            </button>
          )}
        </>
      )}

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={onCreated} />}
    </div>
  );
}

const SkeletonPost = () => (
  <div className="card post-card">
    <div style={{ display:'flex', gap:10, marginBottom:12 }}>
      <div className="skel" style={{ width:38, height:38, borderRadius:'50%', flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div className="skel" style={{ height:12, width:120, marginBottom:6 }} />
        <div className="skel" style={{ height:10, width:80 }} />
      </div>
    </div>
    <div className="skel" style={{ height:12, marginBottom:6 }} />
    <div className="skel" style={{ height:12, width:'70%' }} />
  </div>
);
