import React, { useEffect, useRef } from 'react';
import './MouseDot.css';

// Reticle cursor. Position is written straight to the element's transform —
// routing every mousemove through React state re-rendered the component at
// pointer-event rate for nothing. Hidden until the first real mouse move so
// it never sits parked in the top-left corner, and never shown for touch.
const MouseDot = () => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      el.classList.add('mouse-dot-live');
    };
    const onLeave = () => el.classList.remove('mouse-dot-live');
    const onDown = () => {
      el.classList.remove('bounce');
      void el.offsetWidth; // restart the animation on rapid clicks
      el.classList.add('bounce');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="mouse-dot" aria-hidden="true">
      <span className="mouse-dot-ring" />
      <span className="mouse-dot-label">BOOP</span>
    </div>
  );
};

export default MouseDot;
