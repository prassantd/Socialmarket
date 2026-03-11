import React, { useState } from 'react';
import { postAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

export default function CreatePostModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [content,  setContent]  = useState('');
  const [files,    setFiles]    = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const addFiles = e => {
    const chosen = Array.from(e.target.files).slice(0, 5 - files.length);
    setFiles(p => [...p, ...chosen]);
    setPreviews(p => [...p, ...chosen.map(f => URL.createObjectURL(f))]);
  };

  const removeFile = i => {
    setFiles(p => p.filter((_,j) => j!==i));
    setPreviews(p => p.filter((_,j) => j!==i));
  };

  const submit = async e => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) { toast.error('Add text or image'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      files.forEach(f => fd.append('images', f));
      const r = await postAPI.create(fd);
      toast.success('Posted!');
      onCreated?.(r.data.post);
      onClose();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal fade">
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar user={user} size={36} />
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>@{user?.username}</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>Create a post</div>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize:20, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit}>
            <textarea className="inp" rows={4} placeholder="What's on your mind?" value={content} onChange={e=>setContent(e.target.value)} style={{ marginBottom:12 }} />

            {/* Image previews */}
            {previews.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={src} alt="" style={{ width:80, height:80, objectFit:'cover', borderRadius:8 }} />
                    <button type="button" onClick={() => removeFile(i)} style={{ position:'absolute', top:-4, right:-4, width:18, height:18, background:'#ef4444', color:'#fff', borderRadius:'50%', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <label style={{ cursor:'pointer', color:'#6366f1', fontWeight:600, fontSize:13 }}>
                📷 Add Photos
                <input type="file" accept="image/*" multiple onChange={addFiles} style={{ display:'none' }} />
              </label>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
                  {loading ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
