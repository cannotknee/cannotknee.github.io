import React, { useEffect, useState } from 'react';
import './MouseDot.css';

const MouseDot = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <div
      className="mouse-dot"
      style={{ top: mousePosition.y, left: mousePosition.x }}
    ></div>
  );
};

export default MouseDot;