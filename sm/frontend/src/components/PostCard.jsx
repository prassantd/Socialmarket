import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import { ago, REACTIONS, imgSrc } from '../utils/helpers';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

export default function PostCard({ post: initial, onDelete }) {
  const { user, isAuth } = useAuth();
  const [post, setPost] = useState(initial);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments,  setShowComments]  = useState(false);
  const [comments,  setComments]  = useState([]);
  const [loadedComments, setLoadedComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  const react = async (type) => {
    if (!isAuth) { toast.error('Login to react'); return; }
    try {
      const r = await postAPI.react(post._id, type);
      setPost(p => ({ ...p, reactionsCount: r.data.reactionsCount, userReaction: r.data.userReaction }));
    } catch (e) { toast.error(errMsg(e)); }
    setShowReactions(false);
  };

  const toggleComments = async () => {
    if (!loadedComments) {
      const r = await postAPI.comments(post._id);
      setComments(r.data.comments);
      setLoadedComments(true);
    }
    setShowComments(p => !p);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      const r = await postAPI.addComment(post._id, newComment.trim());
      setComments(p => [...p, r.data.comment]);
      setPost(p => ({ ...p, commentsCount: p.commentsCount + 1 }));
      setNewComment('');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setAddingComment(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try { await postAPI.delete(post._id); onDelete?.(post._id); toast.success('Deleted'); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const imgCount = post.images?.length || 0;

  return (
    <div className="card post-card fade">
      {/* Shared from */}
      {post.sharedFrom && (
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>🔁 Shared from <strong>@{post.sharedFrom?.author?.username}</strong></div>
      )}

      {/* Author */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <Link to={`/profile/${post.author?._id}`}><Avatar user={post.author} size={38} /></Link>
        <div style={{ flex:1 }}>
          <Link to={`/profile/${post.author?._id}`} style={{ fontWeight:700, fontSize:14 }}>@{post.author?.username}</Link>
          <div style={{ color:'#94a3b8', fontSize:12 }}>{ago(post.createdAt)}</div>
        </div>
        {(post.author?._id === user?._id || user?.role === 'admin') && (
          <button onClick={handleDelete} style={{ color:'#94a3b8', fontSize:18, background:'none', border:'none', cursor:'pointer', padding:4 }}>×</button>
        )}
      </div>

      {/* Content */}
      {post.content && <p style={{ fontSize:15, lineHeight:1.6, marginBottom: imgCount ? 0 : 8 }}>{post.content}</p>}

      {/* Images */}
      {imgCount > 0 && (
        <div className={`post-images count-${Math.min(imgCount, 3)}`}>
          {post.images.slice(0, 3).map((img, i) => (
            <img key={i} src={imgSrc(img.url)} alt="" onError={e => e.target.style.display='none'} />
          ))}
        </div>
      )}

      {/* Shared original preview */}
      {post.sharedFrom && !post.content && (
        <div style={{ border:'1px solid var(--border)', borderRadius:8, padding:12, marginTop:8, background:'#f8fafc' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Avatar user={post.sharedFrom?.author} size={26} />
            <span style={{ fontWeight:600, fontSize:13 }}>@{post.sharedFrom?.author?.username}</span>
          </div>
          <p className="clamp3" style={{ fontSize:13, color:'#475569' }}>{post.sharedFrom?.content}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:4, marginTop:12, borderTop:'1px solid var(--border)', paddingTop:10 }}>
        {/* React */}
        <div style={{ position:'relative' }}>
          <button
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => react(post.userReaction || 'like')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:6, background: post.userReaction ? '#f0f4ff':'transparent', border:'none', cursor:'pointer', color: post.userReaction ? '#6366f1':'#475569', fontSize:13, fontWeight:600 }}
          >
            {REACTIONS[post.userReaction] || '👍'} {post.reactionsCount || 0}
          </button>
          {showReactions && (
            <div onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}
              style={{ position:'absolute', bottom:'calc(100% + 4px)', left:0, background:'#fff', border:'1px solid var(--border)', borderRadius:99, padding:'6px 10px', display:'flex', gap:4, zIndex:10, boxShadow:'0 4px 16px rgba(0,0,0,.1)', whiteSpace:'nowrap' }}>
              {Object.entries(REACTIONS).map(([type, emoji]) => (
                <button key={type} onClick={() => react(type)} title={type}
                  style={{ fontSize:20, background:'none', border:'none', cursor:'pointer', borderRadius:'50%', padding:2, transition:'transform .1s' }}
                  onMouseEnter={e => e.target.style.transform='scale(1.3)'}
                  onMouseLeave={e => e.target.style.transform='scale(1)'}
                >{emoji}</button>
              ))}
            </div>
          )}
        </div>

        {/* Comment */}
        <button onClick={toggleComments} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:6, background:'transparent', border:'none', cursor:'pointer', color:'#475569', fontSize:13, fontWeight:600 }}>
          💬 {post.commentsCount || 0}
        </button>

        {/* Share */}
        {isAuth && (
          <button onClick={async () => { await postAPI.share(post._id, ''); toast.success('Shared!'); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:6, background:'transparent', border:'none', cursor:'pointer', color:'#475569', fontSize:13, fontWeight:600 }}>
            🔁 {post.sharesCount || 0}
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ marginTop:10, borderTop:'1px solid var(--border)', paddingTop:10 }}>
          {comments.map(c => (
            <div key={c._id} style={{ display:'flex', gap:8, marginBottom:10 }}>
              <Avatar user={c.author} size={28} />
              <div style={{ flex:1, background:'#f8fafc', borderRadius:8, padding:'7px 10px' }}>
                <span style={{ fontWeight:700, fontSize:12, marginRight:6 }}>@{c.author?.username}</span>
                <span style={{ fontSize:13 }}>{c.content}</span>
              </div>
            </div>
          ))}
          {isAuth && (
            <form onSubmit={submitComment} style={{ display:'flex', gap:8, marginTop:6 }}>
              <Avatar user={user} size={28} />
              <input className="inp" value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Write a comment…" style={{ flex:1 }} />
              <button type="submit" disabled={addingComment} className="btn btn-primary btn-sm">Post</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
