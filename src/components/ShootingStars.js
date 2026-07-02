import { useEffect, useRef } from "react";

const COUNT = 5;

function spawn(w, h) {
  return {
    x: Math.random() * w * 1.3 - w * 0.15,
    y: Math.random() * h * 0.55 - h * 0.1,
    angle: (Math.PI / 180) * (38 + Math.random() * 18),
    speed: 7 + Math.random() * 8,
    len: 80 + Math.random() * 110,
    alpha: 0,
    maxAlpha: 0.38 + Math.random() * 0.48,
    width: 0.6 + Math.random() * 1.3,
    phase: "wait",
    life: 0,
    maxLife: 0,
    wait: 420 + Math.floor(Math.random() * 660), // 7s–18s between stars at 60fps
    waited: 0,
  };
}

export default function ShootingStars() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // stagger initial delays across ~20 seconds so they feel occasional
    let stars = Array.from({ length: COUNT }, (_, i) => {
      const s = spawn(canvas.width, canvas.height);
      s.wait = 120 + i * 260;
      return s;
    });

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars = stars.map((s) => {
        if (s.phase === "wait") {
          if (++s.waited >= s.wait) s.phase = "in";
          return s;
        }

        if (s.phase === "in") {
          s.alpha = Math.min(s.alpha + 0.1, s.maxAlpha);
          if (s.alpha >= s.maxAlpha) {
            s.phase = "travel";
            s.maxLife = Math.floor(s.len / s.speed) + 14;
          }
        }

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.life++;

        if (s.phase === "travel" && s.life >= s.maxLife) s.phase = "out";
        if (s.phase === "out") {
          s.alpha -= 0.055;
          if (s.alpha <= 0) return spawn(canvas.width, canvas.height);
        }

        if (s.alpha <= 0) return s;

        // trail length grows with life, up to full length
        const progress = Math.min(s.life / Math.max(s.maxLife * 0.65, 1), 1);
        const tailX = s.x - Math.cos(s.angle) * s.len * progress;
        const tailY = s.y - Math.sin(s.angle) * s.len * progress;

        // gradient trail: transparent tail → bright head
        const trail = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        trail.addColorStop(0,   `rgba(180, 240, 255, 0)`);
        trail.addColorStop(0.5, `rgba(210, 248, 255, ${s.alpha * 0.3})`);
        trail.addColorStop(1,   `rgba(255, 255, 255, ${s.alpha})`);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = trail;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.stroke();

        // soft radial glow at the head
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.width * 5);
        glow.addColorStop(0,   `rgba(220, 252, 255, ${s.alpha})`);
        glow.addColorStop(0.4, `rgba(200, 245, 255, ${s.alpha * 0.35})`);
        glow.addColorStop(1,   `rgba(180, 235, 255, 0)`);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.restore();

        return s;
      });

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="shooting-stars" />;
}
