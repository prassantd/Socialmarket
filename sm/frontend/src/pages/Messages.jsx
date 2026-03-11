import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { msgAPI, errMsg } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { ago, imgSrc } from '../utils/helpers';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

export default function Messages() {
  const { id: convId } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { on, off, emit } = useSocket();
  const [convs,    setConvs]    = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [typing,  setTyping]  = useState(false);
  const bottom = useRef(null);
  const typingTimer = useRef(null);

  // Load conversations
  useEffect(() => {
    msgAPI.convs().then(r => setConvs(r.data.conversations)).catch(()=>{});
  }, []);

  // Handle ?user= param
  useEffect(() => {
    const uid = sp.get('user');
    if (uid) {
      msgAPI.start(uid).then(r => {
        const c = r.data.conversation;
        setConvs(p => p.find(x=>x._id===c._id) ? p : [c,...p]);
        nav(`/messages/${c._id}`, { replace:true });
      }).catch(()=>{});
    }
  }, [sp, nav]);

  // Load messages when conv changes
  useEffect(() => {
    if (!convId) return;
    const c = convs.find(x=>x._id===convId);
    if (c) setActiveConv(c);
    msgAPI.messages(convId).then(r => setMessages(r.data.messages)).catch(()=>{});
    emit('conv:join', convId);
  }, [convId, convs, emit]);

  // Scroll to bottom
  useEffect(() => { bottom.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Socket events
  useEffect(() => {
    const onMsg = (msg) => {
      if (msg.conversation === convId) setMessages(p => [...p, msg]);
      setConvs(p => p.map(c => c._id===msg.conversation ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt } : c));
    };
    const onTyping = (d) => {
      if (d.conversationId === convId && d.userId !== user?._id) {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 2000);
      }
    };
    on('msg:new', onMsg);
    on('msg:typing', onTyping);
    return () => { off('msg:new', onMsg); off('msg:typing', onTyping); };
  }, [convId, user, on, off]);

  const send = async e => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await msgAPI.send(convId, text.trim());
      emit('msg:send', { ...r.data.message, conversationId: convId });
      setMessages(p => [...p, r.data.message]);
      setText('');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSending(false); }
  };

  const other = (conv) => conv.participants?.find(p => p._id !== user?._id);

  return (
    <div className="msg-layout">
      {/* Sidebar */}
      <div className="card msg-sidebar" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:15 }}>Messages</div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {convs.length === 0
            ? <div style={{ padding:20, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No conversations yet<br/><Link to="/people" style={{ color:'#6366f1', fontWeight:600 }}>Find people</Link></div>
            : convs.map(c => {
                const o = other(c);
                return (
                  <Link key={c._id} to={`/messages/${c._id}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: c._id===convId ? '#f0f4ff':'#fff', borderBottom:'1px solid #f8fafc', textDecoration:'none' }}>
                    <Avatar user={o} size={36} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>@{o?.username}</div>
                      <div className="truncate" style={{ fontSize:12, color:'#94a3b8' }}>{c.lastMessage?.content || 'Start chatting'}</div>
                    </div>
                  </Link>
                );
              })
          }
        </div>
      </div>

      {/* Chat */}
      <div className="card msg-main" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!convId ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, color:'#94a3b8' }}>
            <span style={{ fontSize:48 }}>💬</span>
            <div style={{ fontWeight:700, fontSize:16, color:'#475569' }}>Select a conversation</div>
            <Link to="/people" className="btn btn-primary btn-sm">Find people to message</Link>
          </div>
        ) : (
          <>
            {/* Header */}
            {activeConv && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                <Avatar user={other(activeConv)} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700 }}>@{other(activeConv)?.username}</div>
                </div>
                <Link to={`/profile/${other(activeConv)?._id}`} className="btn btn-secondary btn-sm">Profile</Link>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
              {messages.map(m => {
                const mine = m.sender?._id === user?._id || m.sender === user?._id;
                return (
                  <div key={m._id} style={{ display:'flex', justifyContent: mine ? 'flex-end':'flex-start', alignItems:'flex-end', gap:6 }}>
                    {!mine && <Avatar user={m.sender} size={26} />}
                    <div style={{ maxWidth:'65%' }}>
                      <div style={{ background: mine ? '#6366f1':'#f1f5f9', color: mine ? '#fff':'#0f172a', borderRadius: mine ? '12px 12px 2px 12px':'12px 12px 12px 2px', padding:'8px 12px', fontSize:14 }}>
                        {m.content}
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:2, textAlign: mine ? 'right':'left' }}>{ago(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              {typing && <div style={{ color:'#94a3b8', fontSize:12 }}>typing…</div>}
              <div ref={bottom} />
            </div>

            {/* Input */}
            <form onSubmit={send} style={{ display:'flex', gap:8, padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
              <input className="inp" style={{ flex:1 }} placeholder="Type a message…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={() => emit('msg:typing', { conversationId:convId, userId:user?._id })} />
              <button type="submit" disabled={!text.trim()||sending} className="btn btn-primary">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
