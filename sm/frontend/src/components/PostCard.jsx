import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import { ago, REACTIONS, imgSrc } from '../utils/helpers';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

// Lightbox — fullscreen image viewer with prev/next navigation
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape')    onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
    >
      {/* Close button */}
      <button onClick={onClose} style={{ position:'absolute', top:16, right:20, color:'#fff', fontSize:32, background:'none', border:'none', cursor:'pointer', lineHeight:1, zIndex:10 }}>×</button>

      {/* Counter */}
      {images.length > 1 && (
        <div style={{ position:'absolute', top:18, left:'50%', transform:'translateX(-50%)', color:'#fff', fontSize:13, fontWeight:600, background:'rgba(0,0,0,.5)', padding:'4px 12px', borderRadius:99 }}>
          {idx + 1} / {images.length}
        </div>
      )}

      {/* Prev button */}
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
          style={{ position:'absolute', left:16, color:'#fff', fontSize:36, background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', borderRadius:'50%', width:50, height:50, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
      )}

      {/* Image */}
      <img
        src={imgSrc(images[idx].url)}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:8, boxShadow:'0 8px 40px rgba(0,0,0,.6)' }}
      />

      {/* Next button */}
      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
          style={{ position:'absolute', right:16, color:'#fff', fontSize:36, background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', borderRadius:'50%', width:50, height:50, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
          {images.map((img, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              style={{ width:48, height:48, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i===idx ? '2px solid #fff':'2px solid rgba(255,255,255,.3)', opacity: i===idx ? 1 : 0.6, transition:'all .15s' }}>
              <img src={imgSrc(img.url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function PostCard({ post: initial, onDelete }) {
  const { user, isAuth } = useAuth();
  const [post, setPost] = useState(initial);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments,  setShowComments]  = useState(false);
  const [comments,  setComments]  = useState([]);
  const [loadedComments, setLoadedComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [lightbox, setLightbox] = useState(null); // null or index number

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
      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox images={post.images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

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

      {/* Images — click any to open lightbox */}
      {imgCount > 0 && (
        <div className={`post-images count-${Math.min(imgCount, 3)}`}>
          {post.images.slice(0, 3).map((img, i) => (
            <div key={i} style={{ position:'relative', cursor:'zoom-in' }} onClick={() => setLightbox(i)}>
              <img src={imgSrc(img.url)} alt="" onError={e => e.target.style.display='none'} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              {/* Show "+N more" overlay on the last visible image if there are more */}
              {i === 2 && imgCount > 3 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:22, fontWeight:800 }}>
                  +{imgCount - 3}
                </div>
              )}
            </div>
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
