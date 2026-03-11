import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { svcAPI, errMsg } from '../api';
import toast from 'react-hot-toast';

const CATS = ['Clothing & Accessories','Electronics & Gadgets','Cleaning & Maintenance','Massage & Wellness','Renovation & Repair','Landscaping','Video Editing','Tutoring','Photography','Other'];

// ⚠️ Field must be defined OUTSIDE the component so React doesn't remount it on every keystroke
const Field = ({ name, label, type = 'text', placeholder, as, value, onChange, required }) => (
  <div className="inp-group">
    <label className="inp-label">{label}</label>
    {as === 'textarea'
      ? <textarea name={name} className="inp" rows={4} placeholder={placeholder} value={value} onChange={onChange} required={required} />
      : <input    name={name} className="inp" type={type} placeholder={placeholder} value={value} onChange={onChange} required={required} />
    }
  </div>
);

export default function CreateService() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [f, setF] = useState({ title:'', category:'', description:'', price:'', priceType:'fixed', location:'', phone:'', email:'', whatsapp:'' });
  const [files, setFiles]       = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    svcAPI.get(id).then(r => {
      const s = r.data.service;
      setF({ title:s.title, category:s.category, description:s.description, price:s.price?.amount||'', priceType:s.price?.priceType||'fixed', location:s.location, phone:s.contactInfo?.phone||'', email:s.contactInfo?.email||'', whatsapp:s.contactInfo?.whatsapp||'' });
    }).catch(() => toast.error('Failed to load service'));
  }, [id, isEdit]);

  const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));

  const addFiles = e => {
    const chosen = Array.from(e.target.files).slice(0, 5);
    setFiles(chosen);
    setPreviews(chosen.map(f => URL.createObjectURL(f)));
  };

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      files.forEach(file => fd.append('images', file));
      if (isEdit) await svcAPI.update(id, fd);
      else        await svcAPI.create(fd);
      toast.success(isEdit ? 'Service updated!' : 'Service listed!');
      nav('/services');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      <h1 style={{ fontFamily:'Sora', fontWeight:800, fontSize:22, marginBottom:20 }}>
        {isEdit ? 'Edit Service' : 'List a New Service'}
      </h1>

      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <h2 style={{ fontWeight:700, fontSize:15 }}>Basic Information</h2>
          <Field name="title" label="Service Title *" placeholder="e.g. Professional House Cleaning" value={f.title} onChange={ch} required />
          <div className="inp-group">
            <label className="inp-label">Category *</label>
            <select name="category" className="inp" value={f.category} onChange={ch} required>
              <option value="">Select a category</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field name="description" label="Description *" placeholder="Describe your service in detail…" as="textarea" value={f.description} onChange={ch} required />
          <Field name="location" label="Location *" placeholder="e.g. New York, NY or Online" value={f.location} onChange={ch} required />
        </div>

        <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <h2 style={{ fontWeight:700, fontSize:15 }}>Pricing</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field name="price" label="Price (USD) *" type="number" placeholder="0" value={f.price} onChange={ch} required />
            <div className="inp-group">
              <label className="inp-label">Price Type</label>
              <select name="priceType" className="inp" value={f.priceType} onChange={ch}>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Per Hour</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <h2 style={{ fontWeight:700, fontSize:15 }}>Contact Information</h2>
          <Field name="phone"    label="Phone"    placeholder="+1 234 567 8900"      value={f.phone}    onChange={ch} />
          <Field name="email"    label="Email"    type="email" placeholder="contact@example.com" value={f.email}    onChange={ch} />
          <Field name="whatsapp" label="WhatsApp" placeholder="+1 234 567 8900"      value={f.whatsapp} onChange={ch} />
        </div>

        <div className="card" style={{ padding:20 }}>
          <h2 style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Photos (up to 5)</h2>
          <label style={{ display:'block', border:'2px dashed var(--border)', borderRadius:10, padding:20, textAlign:'center', cursor:'pointer', color:'#94a3b8' }}>
            📷 Click to upload images
            <input type="file" accept="image/*" multiple onChange={addFiles} style={{ display:'none' }} />
          </label>
          {previews.length > 0 && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
              {previews.map((src,i) => (
                <img key={i} src={src} alt="" style={{ width:80, height:80, objectFit:'cover', borderRadius:8 }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" onClick={() => nav('/services')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'List Service'}
          </button>
        </div>
      </form>
    </div>
  );
}
