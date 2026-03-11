import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errMsg } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const [email, setEmail]     = useState('');
  const [pass,  setPass]      = useState('');
  const [show,  setShow]      = useState(false);
  const [busy,  setBusy]      = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, pass);
      toast.success('Welcome back!');
      nav(state?.from?.pathname || '/', { replace: true });
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#e0e7ff 0%,#f0f4ff 100%)', padding:16 }}>
      <div className="card fade" style={{ width:'100%', maxWidth:400, padding:32 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Sora', fontWeight:800, fontSize:24, margin:'0 auto 12px' }}>S</div>
          <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22 }}>Welcome back</h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>Log in to SocialMarket</p>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="inp-group">
            <label className="inp-label">Email</label>
            <input className="inp" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="inp-group">
            <label className="inp-label">Password</label>
            <div style={{ position:'relative' }}>
              <input className="inp" type={show?'text':'password'} placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} required style={{ paddingRight:40 }} />
              <button type="button" onClick={() => setShow(p=>!p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14 }}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary btn-full" style={{ marginTop:4, padding:'11px 0' }}>
            {busy ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'#64748b' }}>
          Don't have an account? <Link to="/register" style={{ color:'#6366f1', fontWeight:600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
