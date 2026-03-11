import React from 'react';
import { imgSrc, initials } from '../utils/helpers';

const Avatar = ({ user, size = 36 }) => {
  const src = imgSrc(user?.profilePicture);
  if (src)
    return <img src={src} alt={user?.username || ''} className="av" style={{ width: size, height: size }} onError={e => (e.target.style.display = 'none')} />;
  return (
    <div className="av-fb" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(user?.username)}
    </div>
  );
};

export default Avatar;
