import React, { useState, useEffect } from 'react';
import { postAPI, errMsg } from '../api';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [page, setPage]   = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async (pg = 1, reset = false) => {
    setLoading(true);
    try {
      const r = await postAPI.explore({ page: pg });
      setPosts(p => reset ? r.data.posts : [...p, ...r.data.posts]);
      setHasMore(r.data.hasMore);
      setPage(pg);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, true); }, []);

  return (
    <div>
      <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22, marginBottom:16 }}>Explore</h1>
      {loading && posts.length === 0 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spin" /></div>
      ) : posts.length === 0 ? (
        <div className="card empty"><div className="empty-icon">🔭</div><h3>Nothing to explore yet</h3></div>
      ) : (
        <>
          {posts.map(p => <PostCard key={p._id} post={p} onDelete={id => setPosts(prev=>prev.filter(x=>x._id!==id))} />)}
          {hasMore && <button onClick={() => load(page+1)} disabled={loading} className="btn btn-secondary btn-full" style={{ marginTop:8 }}>{loading?'Loading…':'Load More'}</button>}
        </>
      )}
    </div>
  );
}
