import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { svcAPI, msgAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import { imgSrc, price, fmt, ago } from '../utils/helpers';
import { Stars } from '../components/ServiceCard';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

export default function ServiceDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, isAuth } = useAuth();
  const [service, setService]     = useState(null);
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [mainImg, setMainImg]     = useState(0);
  const [rating,  setRating]      = useState(5);
  const [content, setContent]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    Promise.all([svcAPI.get(id), svcAPI.reviews(id)])
      .then(([sr, rr]) => {
        setService(sr.data.service);
        setUserReview(sr.data.userReview);
        setReviews(rr.data.reviews);
      })
      .catch(() => toast.error('Failed to load service'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async e => {
    e.preventDefault();
    if (!isAuth) { toast.error('Login to review'); return; }
    setSubmitting(true);
    try {
      const r = await svcAPI.addReview(id, { rating, content });
      setReviews(p => [r.data.review, ...p]);
      setUserReview(r.data.review);
      setContent(''); setRating(5);
      toast.success('Review added!');
      const updated = await svcAPI.get(id);
      setService(updated.data.service);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSubmitting(false); }
  };

  const deleteReview = async (rid) => {
    if (!window.confirm('Delete your review?')) return;
    await svcAPI.delReview(rid);
    setReviews(p => p.filter(r => r._id !== rid));
    setUserReview(null);
    toast.success('Review deleted');
  };

  const messageProvider = async () => {
    if (!isAuth) { nav('/login'); return; }
    try {
      const r = await msgAPI.start(service.provider._id);
      nav(`/messages/${r.data.conversation._id}`);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const deleteService = async () => {
    if (!window.confirm('Delete this service?')) return;
    await svcAPI.delete(id);
    toast.success('Service deleted');
    nav('/services');
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spin" /></div>;
  if (!service) return <div className="card empty"><div className="empty-icon">🔍</div><h3>Service not found</h3></div>;

  const isOwner = user?._id === service.provider?._id;
  const imgs    = service.images || [];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>
      {/* Left */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {/* Image gallery */}
        <div className="card" style={{ overflow:'hidden', padding:0 }}>
          <div style={{ height:280, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:60 }}>
            {imgs[mainImg] ? <img src={imgSrc(imgs[mainImg].url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} /> : '🛠️'}
          </div>
          {imgs.length > 1 && (
            <div style={{ display:'flex', gap:6, padding:10 }}>
              {imgs.map((img, i) => (
                <div key={i} onClick={() => setMainImg(i)} style={{ width:56, height:56, borderRadius:6, overflow:'hidden', cursor:'pointer', border: i===mainImg ? '2px solid #6366f1' : '2px solid transparent' }}>
                  <img src={imgSrc(img.url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:600, padding:'2px 10px', borderRadius:99, background:'#e0e7ff', color:'#4338ca' }}>{service.category}</span>
            {service.isFeatured && <span style={{ fontSize:12, color:'#d97706' }}>⭐ Featured</span>}
          </div>
          <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22, marginBottom:8 }}>{service.title}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <Stars rating={service.averageRating} size={16} />
            <span style={{ fontWeight:700 }}>{service.averageRating?.toFixed(1)}</span>
            <span style={{ color:'#94a3b8' }}>({service.reviewsCount} reviews)</span>
            <span style={{ color:'#94a3b8' }}>· {service.viewsCount} views</span>
          </div>
          <p style={{ color:'#475569', lineHeight:1.7, marginBottom:14 }}>{service.description}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:16, fontSize:13, color:'#64748b' }}>
            <span>📍 {service.location}</span>
            <span>📅 Listed {fmt(service.createdAt)}</span>
          </div>
        </div>

        {/* Reviews */}
        <div className="card" style={{ padding:20 }}>
          <h2 style={{ fontWeight:700, fontSize:16, marginBottom:14 }}>Reviews ({reviews.length})</h2>

          {/* Write review */}
          {isAuth && !isOwner && !userReview && (
            <form onSubmit={submitReview} style={{ background:'#f8fafc', borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>Write a review</div>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n} onClick={() => setRating(n)} style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', color: n<=rating ? '#f59e0b':'#e2e8f0' }}>★</button>
                ))}
              </div>
              <textarea className="inp" rows={3} placeholder="Share your experience…" value={content} onChange={e=>setContent(e.target.value)} required style={{ marginBottom:8 }} />
              <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">{submitting ? 'Posting…':'Post Review'}</button>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="empty" style={{ padding:'20px 0' }}>
              <div className="empty-icon">⭐</div><p>No reviews yet. Be the first!</p>
            </div>
          ) : reviews.map(r => (
            <div key={r._id} style={{ borderBottom:'1px solid var(--border)', paddingBottom:12, marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <Avatar user={r.reviewer} size={32} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>@{r.reviewer?.username}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Stars rating={r.rating} size={12} />
                    <span style={{ fontSize:11, color:'#94a3b8' }}>{ago(r.createdAt)}</span>
                  </div>
                </div>
                {(r.reviewer?._id === user?._id || user?.role === 'admin') && (
                  <button onClick={() => deleteReview(r._id)} style={{ fontSize:18, color:'#94a3b8', background:'none', border:'none', cursor:'pointer' }}>×</button>
                )}
              </div>
              <p style={{ fontSize:13, color:'#475569' }}>{r.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:76 }}>
        {/* Price + actions */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontFamily:'Sora', fontWeight:800, fontSize:26, color:'#6366f1', marginBottom:16 }}>
            {price(service.price?.amount, service.price?.priceType)}
          </div>
          {!isOwner ? (
            <button onClick={messageProvider} className="btn btn-primary btn-full" style={{ marginBottom:8 }}>
              💬 Message Provider
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <Link to={`/services/${id}/edit`} className="btn btn-secondary btn-full">✏️ Edit Service</Link>
              <button onClick={deleteService} className="btn btn-danger btn-full">Delete Service</button>
            </div>
          )}
        </div>

        {/* Provider */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Service Provider</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <Link to={`/profile/${service.provider?._id}`}><Avatar user={service.provider} size={44} /></Link>
            <div>
              <Link to={`/profile/${service.provider?._id}`} style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>@{service.provider?.username}</Link>
              <div style={{ fontSize:12, color:'#94a3b8' }}>{service.provider?.followersCount} followers</div>
            </div>
          </div>
          {service.provider?.bio && <p style={{ fontSize:12, color:'#64748b' }}>{service.provider.bio}</p>}
        </div>

        {/* Contact */}
        {(service.contactInfo?.phone || service.contactInfo?.email || service.contactInfo?.whatsapp) && (
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Contact</div>
            {service.contactInfo.phone    && <div style={{ fontSize:13, color:'#475569', marginBottom:6 }}>📞 {service.contactInfo.phone}</div>}
            {service.contactInfo.email    && <div style={{ fontSize:13, color:'#475569', marginBottom:6 }}>✉️ {service.contactInfo.email}</div>}
            {service.contactInfo.whatsapp && <div style={{ fontSize:13, color:'#475569' }}>💬 {service.contactInfo.whatsapp}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
