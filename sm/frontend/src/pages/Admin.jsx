import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import { fmt } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [posts, setPosts]     = useState([]);
  const [services, setServices] = useState([]);
  const [tab, setTab]         = useState('Stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') { nav('/'); return; }
    Promise.all([adminAPI.stats(), adminAPI.users(), adminAPI.posts(), adminAPI.services()])
      .then(([sr, ur, pr, svr]) => {
        setStats(sr.data.stats);
        setUsers(ur.data.users);
        setPosts(pr.data.posts);
        setServices(svr.data.services);
      }).catch(e => toast.error(errMsg(e))).finally(() => setLoading(false));
  }, [user, nav]);

  const toggleUser = async id => {
    const r = await adminAPI.toggleUser(id);
    setUsers(p => p.map(u => u._id===id ? { ...u, isActive: !u.isActive } : u));
    toast.success(r.data.message);
  };

  const removePost = async id => {
    if (!window.confirm('Remove post?')) return;
    await adminAPI.removePost(id);
    setPosts(p => p.filter(x => x._id!==id));
    toast.success('Removed');
  };

  const toggleFeatured = async id => {
    const r = await adminAPI.toggleFeatured(id);
    setServices(p => p.map(s => s._id===id ? { ...s, isFeatured: !s.isFeatured } : s));
    toast.success(r.data.message);
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spin" /></div>;

  const TABS = ['Stats','Users','Posts','Services'];
  const Th = ({ children }) => <th style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', background:'#f8fafc', borderBottom:'1px solid var(--border)' }}>{children}</th>;
  const Td = ({ children }) => <td style={{ padding:'10px 12px', fontSize:13, borderBottom:'1px solid #f8fafc' }}>{children}</td>;

  return (
    <div>
      <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22, marginBottom:16 }}>Admin Dashboard</h1>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:16, background:'#f1f5f9', borderRadius:8, padding:3, width:'fit-content' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className="btn btn-sm" style={{ background: tab===t ? '#fff':'transparent', boxShadow: tab===t ? '0 1px 4px rgba(0,0,0,.1)':'' }}>{t}</button>)}
      </div>

      {tab === 'Stats' && stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {[['👥 Users', stats.users],['📝 Posts', stats.posts],['🛠️ Services', stats.services],['⭐ Reviews', stats.reviews]].map(([label, val]) => (
            <div key={label} className="card" style={{ padding:20, textAlign:'center' }}>
              <div style={{ fontFamily:'Sora', fontWeight:800, fontSize:32 }}>{val?.toLocaleString()}</div>
              <div style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Users' && (
        <div className="card" style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Username','Email','Role','Status','Joined','Actions'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>{users.map(u => (
              <tr key={u._id}>
                <Td>@{u.username}</Td>
                <Td>{u.email}</Td>
                <Td><span style={{ fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:99, background: u.role==='admin'?'#fef3c7':'#f1f5f9', color: u.role==='admin'?'#d97706':'#475569' }}>{u.role}</span></Td>
                <Td><span style={{ fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:99, background: u.isActive?'#dcfce7':'#fee2e2', color: u.isActive?'#16a34a':'#dc2626' }}>{u.isActive?'Active':'Banned'}</span></Td>
                <Td>{fmt(u.createdAt)}</Td>
                <Td>{u.role!=='admin' && <button onClick={() => toggleUser(u._id)} style={{ fontSize:12, color: u.isActive?'#dc2626':'#16a34a', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>{u.isActive?'Ban':'Unban'}</button>}</Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'Posts' && (
        <div className="card" style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Author','Content','Date','Actions'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>{posts.map(p => (
              <tr key={p._id}>
                <Td>@{p.author?.username}</Td>
                <Td><span style={{ maxWidth:300, display:'block' }} className="clamp2">{p.content||'[image]'}</span></Td>
                <Td>{fmt(p.createdAt)}</Td>
                <Td><button onClick={() => removePost(p._id)} style={{ fontSize:12, color:'#dc2626', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>Remove</button></Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'Services' && (
        <div className="card" style={{ overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Title','Provider','Category','Price','Featured','Actions'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>{services.map(s => (
              <tr key={s._id}>
                <Td>{s.title}</Td>
                <Td>@{s.provider?.username}</Td>
                <Td>{s.category}</Td>
                <Td>${s.price?.amount}</Td>
                <Td>{s.isFeatured ? '⭐ Yes' : 'No'}</Td>
                <Td><button onClick={() => toggleFeatured(s._id)} style={{ fontSize:12, color:'#6366f1', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>{s.isFeatured?'Unfeature':'Feature'}</button></Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
