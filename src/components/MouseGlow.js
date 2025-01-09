import React, { useEffect, useState } from "react";
import "./MouseGlow.css";

const MouseGlow = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Set a timeout to update the position with a delay
      setTimeout(() => {
        setPosition({ x: e.clientX, y: e.clientY });
      }, 100); // Adjust the delay time (in milliseconds) as needed
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="mouse-glow"
      style={{ left: position.x, top: position.y }}
    ></div>
  );
};

export default MouseGlow;
