import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { svcAPI, errMsg } from '../api';
import ServiceCard from '../components/ServiceCard';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const CATS = ['Clothing & Accessories','Electronics & Gadgets','Cleaning & Maintenance','Massage & Wellness','Renovation & Repair','Landscaping','Video Editing','Tutoring','Photography','Other'];

export default function Services() {
  const { isAuth } = useAuth();
  const [services, setServices] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cat, setCat]   = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = async (reset = false, pg = 1) => {
    setLoading(true);
    try {
      const r = await svcAPI.getAll({ category: cat || undefined, sort: sort || undefined, page: pg });
      setServices(p => reset ? r.data.services : [...p, ...r.data.services]);
      setHasMore(r.data.hasMore);
      setPage(pg);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    svcAPI.trending().then(r => setTrending(r.data.services)).catch(()=>{});
    load(true, 1);
  }, []);

  useEffect(() => { load(true, 1); }, [cat, sort]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22 }}>Services Marketplace</h1>
          <p style={{ color:'#94a3b8', fontSize:13 }}>Discover local and online services</p>
        </div>
        {isAuth && <Link to="/services/create" className="btn btn-primary btn-sm">+ List Service</Link>}
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>🔥 Trending</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {trending.map(s => <ServiceCard key={s._id} service={s} />)}
          </div>
          <hr className="divider" style={{ marginTop:20 }} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        <button onClick={() => setCat('')} className={`btn btn-sm ${!cat ? 'btn-primary' : 'btn-secondary'}`}>All</button>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`btn btn-sm ${cat===c ? 'btn-primary' : 'btn-secondary'}`}>{c}</button>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <select className="inp" style={{ maxWidth:180 }} value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="">Sort: Latest</option>
          <option value="rating">Top Rated</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {/* Grid */}
      {loading && services.length === 0 ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ overflow:'hidden' }}>
              <div className="skel" style={{ height:160 }} />
              <div style={{ padding:12 }}>
                <div className="skel" style={{ height:12, marginBottom:8 }} />
                <div className="skel" style={{ height:10, width:'60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="card empty"><div className="empty-icon">🛠️</div><h3>No services found</h3><p>Try a different category</p></div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
            {services.map(s => <ServiceCard key={s._id} service={s} />)}
          </div>
          {hasMore && (
            <button onClick={() => load(false, page+1)} disabled={loading} className="btn btn-secondary btn-full" style={{ marginTop:14 }}>
              {loading ? 'Loading…' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
