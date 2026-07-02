import { useEffect, useRef } from 'react';

const TRAIL_LEN   = 20;
const MAX_SPARKS  = 55;

export default function HeroAurora() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext('2d');
    const section = canvas.parentElement;
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // target = raw mouse pos in section coords; pos = lerped follower
    const target = { x: -500, y: -500 };
    const pos    = { x: -500, y: -500 };
    const vel    = { x: 0,    y: 0    };
    const trail  = [];
    const sparks = [];
    let   gAlpha = 0;
    let   heroVisible = true;

    // Fade out when hero section is scrolled away
    const io = new IntersectionObserver(
      ([e]) => { heroVisible = e.isIntersecting; },
      { threshold: 0 }
    );
    io.observe(section);

    const onMove = (e) => {
      const rect = section.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spring follow
      const px = pos.x, py = pos.y;
      pos.x += (target.x - pos.x) * 0.1;
      pos.y += (target.y - pos.y) * 0.1;
      vel.x  = pos.x - px;
      vel.y  = pos.y - py;

      const inHero =
        heroVisible &&
        target.x > 0 && target.x < canvas.width &&
        target.y > 0 && target.y < canvas.height;

      gAlpha += ((inHero ? 1 : 0) - gAlpha) * 0.045;

      // Push new trail point
      trail.unshift({ x: pos.x, y: pos.y });
      if (trail.length > TRAIL_LEN) trail.pop();

      // Spawn sparks from fast movement
      const speed = Math.hypot(vel.x, vel.y);
      if (speed > 1.2 && sparks.length < MAX_SPARKS) {
        const burst = Math.min(Math.ceil(speed * 0.7), 5);
        for (let i = 0; i < burst; i++) {
          const a = Math.atan2(-vel.y, -vel.x) + (Math.random() - 0.5) * 1.4;
          const s = 0.4 + Math.random() * 1.8;
          sparks.push({
            x:    pos.x + (Math.random() - 0.5) * 18,
            y:    pos.y + (Math.random() - 0.5) * 18,
            vx:   Math.cos(a) * s,
            vy:   Math.sin(a) * s,
            life: 0.9 + Math.random() * 0.5,
            r:    0.8 + Math.random() * 2,
          });
        }
      }

      if (gAlpha < 0.005) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // ── Glow layers ──────────────────────────────────────────────────
      const glow = (r, c0, c1) => {
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        ctx.save();
        ctx.globalAlpha = gAlpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      };

      glow(200, 'rgba(0, 210, 200, 0.07)',   'rgba(0, 210, 200, 0)');
      glow(100, 'rgba(0, 235, 222, 0.16)',   'rgba(0, 210, 200, 0)');
      glow(42,  'rgba(120, 255, 248, 0.50)', 'rgba(0, 220, 210, 0)');
      glow(12,  'rgba(230, 255, 255, 0.90)', 'rgba(0, 225, 215, 0)');

      // ── Comet tail ──────────────────────────────────────────────────
      for (let i = 1; i < trail.length; i++) {
        const t = 1 - i / TRAIL_LEN;
        ctx.save();
        ctx.globalAlpha = gAlpha * t * t * 0.6;
        ctx.strokeStyle = 'rgba(0, 220, 212, 1)';
        ctx.lineWidth   = t * 3.5;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x,     trail[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // ── Sparks ──────────────────────────────────────────────────────
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x   += s.vx;
        s.y   += s.vy;
        s.vx  *= 0.94;
        s.vy  *= 0.94;
        s.life -= 0.022;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }

        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        sg.addColorStop(0, 'rgba(210, 255, 252, 1)');
        sg.addColorStop(1, 'rgba(0,   210, 200, 0)');
        ctx.save();
        ctx.globalAlpha = gAlpha * s.life * s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-aurora" />;
}
