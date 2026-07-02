import React, { useEffect, useState, useRef } from "react";
import "./MouseGlow.css";

const MouseGlow = () => {
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetPosition = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const animationFrame = useRef(null);

  const [clicks, setClicks] = useState([]);

  // Smoothly update position towards targetPosition
  const smoothFollow = () => {
    setPosition((pos) => {
      const dx = targetPosition.current.x - pos.x;
      const dy = targetPosition.current.y - pos.y;
      const speed = 0.15;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        return targetPosition.current;
      }
      return {
        x: pos.x + dx * speed,
        y: pos.y + dy * speed,
      };
    });
    animationFrame.current = requestAnimationFrame(smoothFollow);
  };

  useEffect(() => {
    animationFrame.current = requestAnimationFrame(smoothFollow);

    const handleMouseMove = (e) => {
      targetPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e) => {
      const id = Date.now();
      setClicks((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setClicks((prev) => prev.filter((click) => click.id !== id));
      }, 600);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(animationFrame.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <div
        className="mouse-glow"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      />
      {clicks.map((click) => (
        <span
          key={click.id}
          className="mouse-click-effect"
          style={{ left: click.x, top: click.y }}
        />
      ))}
    </>
  );
};

export default MouseGlow;
