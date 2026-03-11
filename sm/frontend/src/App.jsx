import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

import Navbar   from './components/Navbar';
import Sidebar  from './components/Sidebar';

import Login          from './pages/Login';
import Register       from './pages/Register';
import Feed           from './pages/Feed';
import Explore        from './pages/Explore';
import People         from './pages/People';
import Services       from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import CreateService  from './pages/CreateService';
import Messages       from './pages/Messages';
import Notifications  from './pages/Notifications';
import Profile        from './pages/Profile';
import Settings       from './pages/Settings';
import Admin          from './pages/Admin';

const Guard = ({ children, adminOnly = false }) => {
  const { user, loading, isAuth } = useAuth();
  const loc = useLocation();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}><div className="spin" /></div>;
  if (!isAuth)            return <Navigate to="/login" state={{ from: loc }} replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const FULLSCREEN = ['/login', '/register', '/messages'];

const InnerApp = () => {
  const [showCreate, setShowCreate] = useState(false);
  const loc = useLocation();
  const isMessages  = loc.pathname.startsWith('/messages');
  const isFullscreen = ['/login','/register'].some(p => loc.pathname === p);

  if (isFullscreen) return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );

  if (isMessages) return (
    <>
      <Navbar onNewPost={() => setShowCreate(true)} />
      <Routes>
        <Route path="/messages"    element={<Guard><Messages /></Guard>} />
        <Route path="/messages/:id" element={<Guard><Messages /></Guard>} />
      </Routes>
    </>
  );

  return (
    <>
      <Navbar onNewPost={() => setShowCreate(true)} />
      <div className="layout">
        <div className="container three-col">
          {/* Left sidebar */}
          <div className="sidebar">
            <Sidebar />
          </div>

          {/* Main content */}
          <main>
            <Routes>
              <Route path="/"                element={<Feed showCreate={showCreate} setShowCreate={setShowCreate} />} />
              <Route path="/explore"         element={<Explore />} />
              <Route path="/people"          element={<People />} />
              <Route path="/services"        element={<Services />} />
              <Route path="/services/create" element={<Guard><CreateService /></Guard>} />
              <Route path="/services/:id/edit" element={<Guard><CreateService /></Guard>} />
              <Route path="/services/:id"    element={<ServiceDetails />} />
              <Route path="/profile/:id"     element={<Profile />} />
              <Route path="/notifications"   element={<Guard><Notifications /></Guard>} />
              <Route path="/settings"        element={<Guard><Settings /></Guard>} />
              <Route path="/admin"           element={<Guard adminOnly><Admin /></Guard>} />
              <Route path="*"               element={
                <div className="card empty" style={{ marginTop:40 }}>
                  <div className="empty-icon">🔍</div>
                  <h3>Page not found</h3>
                  <a href="/" className="btn btn-primary btn-sm" style={{ marginTop:12 }}>Go Home</a>
                </div>
              } />
            </Routes>
          </main>

          {/* Right sidebar */}
          <aside className="sidebar">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </>
  );
};

const RightSidebar = () => {
  const [trending, setTrending] = React.useState([]);
  React.useEffect(() => {
    import('./api').then(({ svcAPI }) => {
      svcAPI.trending().then(r => setTrending(r.data.services.slice(0,4))).catch(()=>{});
    });
  }, []);

  if (trending.length === 0) return null;

  return (
    <div className="card" style={{ padding:14, position:'sticky', top:76 }}>
      <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>🔥 Trending Services</div>
      {trending.map(s => (
        <a key={s._id} href={`/services/${s._id}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #f8fafc', textDecoration:'none' }}>
          <div style={{ width:38, height:38, borderRadius:8, background:'#f1f5f9', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            {s.images?.[0]
              ? <img src={`http://localhost:5000${s.images[0].url}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />
              : '🛠️'}
          </div>
          <div style={{ minWidth:0 }}>
            <div className="truncate" style={{ fontWeight:600, fontSize:12 }}>{s.title}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>${s.price?.amount}</div>
          </div>
        </a>
      ))}
      <a href="/services" style={{ display:'block', textAlign:'center', fontSize:12, color:'#6366f1', fontWeight:600, marginTop:8 }}>View all →</a>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InnerApp />
        <Toaster position="top-right" toastOptions={{ style: { borderRadius:10, background:'#1e293b', color:'#f8fafc', fontSize:13, fontWeight:600 } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
