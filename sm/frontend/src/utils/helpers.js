import { formatDistanceToNow, format } from 'date-fns';

export const ago  = d => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } };
export const fmt  = d => { try { return format(new Date(d), 'MMM d, yyyy'); } catch { return ''; } };
export const price = (amount, type) => {
  const f = new Intl.NumberFormat('en-US',{ style:'currency', currency:'USD', minimumFractionDigits:0 }).format(amount);
  return type === 'hourly' ? `${f}/hr` : type === 'negotiable' ? `${f} (Negotiable)` : f;
};
export const initials = (n='') => n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() || '?';

// Returns full URL for an image (local upload or external)
export const imgSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:5000${url}`;
};

export const REACTIONS = { like:'👍', love:'❤️', haha:'😂', wow:'😮', sad:'😢', angry:'😠' };

export const CAT_COLOR = {
  'Clothing & Accessories': '#fce7f3',
  'Electronics & Gadgets':  '#dbeafe',
  'Cleaning & Maintenance': '#dcfce7',
  'Massage & Wellness':     '#ede9fe',
  'Renovation & Repair':    '#ffedd5',
  'Landscaping':            '#d1fae5',
  'Video Editing':          '#e0e7ff',
  'Tutoring':               '#fef9c3',
  'Photography':            '#fce7f3',
  'Other':                  '#f1f5f9',
};
