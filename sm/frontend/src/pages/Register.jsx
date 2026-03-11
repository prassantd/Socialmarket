import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errMsg } from '../api';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username:'', email:'', password:'' });
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (f.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await register(f.username, f.email, f.password);
      toast.success('Account created!');
      nav('/');
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#e0e7ff 0%,#f0f4ff 100%)', padding:16 }}>
      <div className="card fade" style={{ width:'100%', maxWidth:400, padding:32 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Sora', fontWeight:800, fontSize:24, margin:'0 auto 12px' }}>S</div>
          <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22 }}>Create account</h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>Join SocialMarket today</p>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { name:'username', label:'Username', type:'text', placeholder:'yourname' },
            { name:'email',    label:'Email',    type:'email', placeholder:'you@email.com' },
            { name:'password', label:'Password', type:'password', placeholder:'Min 6 characters' },
          ].map(inp => (
            <div key={inp.name} className="inp-group">
              <label className="inp-label">{inp.label}</label>
              <input className="inp" type={inp.type} placeholder={inp.placeholder} value={f[inp.name]} onChange={e => setF(p => ({ ...p, [inp.name]: e.target.value }))} required />
            </div>
          ))}
          <button type="submit" disabled={busy} className="btn btn-primary btn-full" style={{ marginTop:4, padding:'11px 0' }}>
            {busy ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'#64748b' }}>
          Already have an account? <Link to="/login" style={{ color:'#6366f1', fontWeight:600 }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
