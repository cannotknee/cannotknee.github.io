import React, { useEffect, useState } from 'react';
import './MouseDot.css';

const MouseDot = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleClick = () => {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300); // duration of bounce animation
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div
      className={`mouse-dot ${isClicked ? 'bounce' : ''}`}
      style={{ top: mousePosition.y, left: mousePosition.x }}
    ></div>
  );
};

export default MouseDot;
