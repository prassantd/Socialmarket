import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userAPI, authAPI, errMsg } from '../api';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, refresh } = useAuth();
  const [f, setF] = useState({ username: user?.username||'', bio: user?.bio||'', location: user?.location||'', website: user?.website||'' });
  const [avatar,   setAvatar]   = useState(null);
  const [preview,  setPreview]  = useState(user?.profilePicture || '');
  const [saving,   setSaving]   = useState(false);
  const [pw, setPw] = useState({ current:'', newPw:'', confirm:'' });
  const [savingPw, setSavingPw] = useState(false);
  const fileRef = useRef();

  const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));

  const pickAvatar = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k,v]) => fd.append(k, v));
      if (avatar) fd.append('profilePicture', avatar);
      const r = await userAPI.update(fd);
      refresh(r.data.user);
      toast.success('Profile updated!');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const savePassword = async e => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) { toast.error('Passwords do not match'); return; }
    if (pw.newPw.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePw({ currentPassword: pw.current, newPassword: pw.newPw });
      toast.success('Password updated!');
      setPw({ current:'', newPw:'', confirm:'' });
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSavingPw(false); }
  };

  return (
    <div style={{ maxWidth:600, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
      <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22 }}>Settings</h1>

      {/* Profile */}
      <div className="card" style={{ padding:20 }}>
        <h2 style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Profile Information</h2>
        <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:4 }}>
            <div style={{ position:'relative' }}>
              <Avatar user={{ ...user, profilePicture: preview }} size={64} />
              <button type="button" onClick={() => fileRef.current?.click()} style={{ position:'absolute', bottom:-2, right:-2, width:22, height:22, background:'#6366f1', color:'#fff', borderRadius:'50%', border:'none', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>Profile Picture</div>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ color:'#6366f1', fontSize:12, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Change photo</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} style={{ display:'none' }} />
            </div>
          </div>

          {[
            { name:'username', label:'Username' },
            { name:'bio',      label:'Bio',      as:'textarea' },
            { name:'location', label:'Location',  placeholder:'e.g. New York, USA' },
            { name:'website',  label:'Website',   placeholder:'https://yoursite.com' },
          ].map(inp => (
            <div key={inp.name} className="inp-group">
              <label className="inp-label">{inp.label}</label>
              {inp.as === 'textarea'
                ? <textarea name={inp.name} className="inp" rows={3} value={f[inp.name]} onChange={ch} placeholder={inp.placeholder||''} />
                : <input    name={inp.name} className="inp" type="text" value={f[inp.name]} onChange={ch} placeholder={inp.placeholder||''} />
              }
            </div>
          ))}

          <button type="submit" disabled={saving} className="btn btn-primary btn-full">
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card" style={{ padding:20 }}>
        <h2 style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Change Password</h2>
        <form onSubmit={savePassword} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { name:'current', label:'Current Password' },
            { name:'newPw',   label:'New Password' },
            { name:'confirm', label:'Confirm New Password' },
          ].map(inp => (
            <div key={inp.name} className="inp-group">
              <label className="inp-label">{inp.label}</label>
              <input className="inp" type="password" value={pw[inp.name]} onChange={e => setPw(p => ({ ...p, [inp.name]: e.target.value }))} placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={savingPw} className="btn btn-primary btn-full">
            {savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="card" style={{ padding:20 }}>
        <h2 style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Account Info</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#94a3b8' }}>Email</span>
            <span style={{ fontWeight:600 }}>{user?.email}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#94a3b8' }}>Role</span>
            <span style={{ fontWeight:600, textTransform:'capitalize' }}>{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
