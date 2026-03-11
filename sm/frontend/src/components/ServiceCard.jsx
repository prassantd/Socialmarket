import React from 'react';
import { Link } from 'react-router-dom';
import { imgSrc, price, CAT_COLOR } from '../utils/helpers';
import Avatar from './Avatar';

export const Stars = ({ rating = 0, size = 14 }) => (
  <span style={{ display:'inline-flex', gap:1 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`star ${i <= Math.round(rating) ? 'on' : ''}`} style={{ fontSize:size }}>★</span>
    ))}
  </span>
);

export default function ServiceCard({ service: s }) {
  const bg = CAT_COLOR[s.category] || '#f1f5f9';
  const imgUrl = s.images?.[0] ? imgSrc(s.images[0].url) : null;

  return (
    <Link to={`/services/${s._id}`} style={{ textDecoration:'none', color:'inherit', display:'block' }}>
      <div className="card svc-card">
        {/* Image */}
        <div className="svc-img" style={{ background: imgUrl ? undefined : bg }}>
          {imgUrl
            ? <img src={imgUrl} alt={s.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
            : '🛠️'
          }
        </div>

        <div className="svc-body">
          {/* Category */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, background:bg, color:'#475569' }}>{s.category}</span>
            {s.isFeatured && <span style={{ fontSize:11, color:'#d97706' }}>⭐ Featured</span>}
          </div>

          {/* Title */}
          <div className="truncate" style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{s.title}</div>

          {/* Provider */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <Avatar user={s.provider} size={20} />
            <span style={{ fontSize:12, color:'#64748b' }}>@{s.provider?.username}</span>
          </div>

          {/* Rating + location */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Stars rating={s.averageRating} />
              <span style={{ fontSize:12, color:'#94a3b8' }}>({s.reviewsCount})</span>
            </div>
            <span style={{ fontSize:12, color:'#94a3b8' }}>📍{s.location}</span>
          </div>

          {/* Price */}
          <div style={{ fontWeight:700, color:'#6366f1', marginTop:8, fontSize:15 }}>
            {price(s.price?.amount, s.price?.priceType)}
          </div>
        </div>
      </div>
    </Link>
  );
}
