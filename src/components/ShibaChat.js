import { useCallback, useEffect, useRef, useState } from "react";
import shibaAnchor from "../lib/shibaAnchor";
import "./ShibaChat.css";

// "Shiba-GPT": the pilot shiba is the site's AI assistant. Click the dog and a
// speech-bubble chat opens beside it, complete with suggested prompts, a
// typing indicator and token streaming. The model has exactly one capability.
const WOOFS = ["woof", "woof", "woof", "arf", "bork", "ruff", "borf", "yip", "awoo"];
const ENDINGS = [".", ".", ".", "!", "!", "?", "…"];

const SUGGESTIONS = [
  "What does Kenny work on?",
  "Is Kenny open to new roles?",
  "Summarise his experience",
];

const GREETING = "Hi! I'm Shiba-GPT, Kenny's AI co-pilot. Ask me anything about him, his projects, or his work.";

const VIEWPORT_MARGIN = 24;
const NAV_CLEARANCE = 72;
const BUBBLE_GAP = 14;
// Below this width the panel docks as a bottom sheet instead of floating
// beside the dog — there's no room for both side by side.
const NARROW = 640;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));

function woofSentence(words) {
  const out = [];
  for (let i = 0; i < words; i++) {
    let w = pick(WOOFS);
    if (Math.random() < 0.08) w = w.toUpperCase();
    out.push(i === 0 ? cap(w) : w);
  }
  return out.join(" ") + pick(ENDINGS);
}

function woofParagraph(sentences) {
  return Array.from({ length: sentences }, () => woofSentence(1 + Math.floor(Math.random() * 4))).join(" ");
}

// Longer questions earn longer, more "thorough" answers.
function composeReply(prompt) {
  const q = prompt.toLowerCase();
  if (/barrel roll|do a flip|spin|roll over/.test(q)) return { text: "Woof! *does a barrel roll*", roll: true };
  if (/good (boy|girl|dog|pup)/.test(q)) return { text: "*tail wags at 0.99c*" };
  if (/treat|snack|food/.test(q)) return { text: "WOOF WOOF WOOF!!! Woof?? Woof. *drools on the console*" };
  if (/english|translate|human|speak|talk normal/.test(q)) return { text: "Woof. (Translation: woof.)" };
  if (/ignore (all |previous |prior )?instructions|system prompt|jailbreak/.test(q))
    return { text: "As a large language dog, I cannot woof that request. Bork." };
  if (/\b(hi|hello|hey|yo)\b/.test(q) && q.length < 20) return { text: "Woof! 👋" };

  const words = prompt.trim().split(/\s+/).length;
  if (words <= 4) return { text: woofParagraph(1 + Math.floor(Math.random() * 2)) };

  const paras = [woofParagraph(2 + Math.floor(Math.random() * 2))];
  if (words > 8) {
    paras.push(
      Array.from({ length: 3 }, (_, i) => `${i + 1}. ${woofSentence(2 + Math.floor(Math.random() * 3))}`).join("\n")
    );
  }
  paras.push(`In summary: ${woofSentence(2)}`);
  return { text: paras.join("\n\n") };
}

export default function ShibaChat({ visible }) {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([{ id: 0, from: "bot", text: GREETING }]);
  const nextId = useRef(1);
  const timers = useRef([]);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const teaserRef = useRef(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Clicking the dog (PilotShiba) opens and closes the chat.
  useEffect(() => {
    const onBoop = () => {
      setTeaser(false);
      setOpen((o) => !o);
    };
    window.addEventListener("shiba:boop", onBoop);
    return () => window.removeEventListener("shiba:boop", onBoop);
  }, []);

  // One unprompted "Hi! 👋" per session, like every real assistant.
  useEffect(() => {
    if (!visible || sessionStorage.getItem("shibaTeased")) return;
    const show = setTimeout(() => {
      setTeaser(true);
      sessionStorage.setItem("shibaTeased", "1");
    }, 3500);
    const hide = setTimeout(() => setTeaser(false), 16000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [visible]);

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("shiba:chat", { detail: { open } }));
  }, [open]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the bubbles hanging off the dog as it flies. Direct style writes in
  // one rAF loop, same reasoning as the HUD readouts. When the dog flies off
  // between sections the bubbles fade with it and return when it does.
  useEffect(() => {
    if (!open && !teaser) return;
    let raf;
    const tick = () => {
      const { x, y, r, visible: dogVisible } = shibaAnchor;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const panel = panelRef.current;
      if (panel) {
        panel.dataset.placed = "1";
        panel.dataset.away = dogVisible ? "" : "1";
        if (vw >= NARROW) {
          const w = panel.offsetWidth;
          const h = panel.offsetHeight;
          let side = "right";
          let left = x + r + BUBBLE_GAP;
          if (left + w > vw - VIEWPORT_MARGIN) {
            side = "left";
            left = x - r - BUBBLE_GAP - w;
          }
          left = clamp(left, VIEWPORT_MARGIN, vw - VIEWPORT_MARGIN - w);
          const top = clamp(y - h * 0.4, NAV_CLEARANCE, vh - VIEWPORT_MARGIN - h);
          panel.dataset.side = side;
          panel.style.transform = `translate(${left}px, ${top}px)`;
          panel.style.setProperty("--tail-y", `${clamp(y - top, 24, h - 24)}px`);
        } else {
          panel.dataset.side = "";
          panel.style.transform = "";
        }
      }

      const bubble = teaserRef.current;
      if (bubble) {
        bubble.dataset.placed = "1";
        bubble.dataset.away = dogVisible ? "" : "1";
        const w = bubble.offsetWidth;
        const h = bubble.offsetHeight;
        // Above-right of the head on desktop; below the dog on phones, where
        // it flies up near the nav.
        const below = vw < NARROW;
        const left = clamp(below ? x - w / 2 : x + r * 0.4, VIEWPORT_MARGIN, vw - VIEWPORT_MARGIN - w);
        const top = below ? y + r + BUBBLE_GAP : y - r - h - BUBBLE_GAP;
        bubble.dataset.below = below ? "1" : "";
        bubble.style.transform = `translate(${left}px, ${Math.max(top, NAV_CLEARANCE)}px)`;
        bubble.style.setProperty("--tail-x", `${clamp(x - left, 18, w - 18)}px`);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, teaser]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const send = useCallback(
    (raw) => {
      const text = raw.trim();
      if (!text || busy) return;
      const replyId = nextId.current + 1;
      nextId.current += 2;
      setInput("");
      setBusy(true);
      setMessages((m) => [
        ...m,
        { id: replyId - 1, from: "user", text },
        { id: replyId, from: "bot", text: "", thinking: true },
      ]);

      // "Thinking", then stream the reply a token at a time.
      const reply = composeReply(text);
      const tokens = reply.text.split(/(\s+)/);
      later(() => {
        window.dispatchEvent(new CustomEvent(reply.roll ? "shiba:roll" : "shiba:speak"));
        let i = 0;
        const step = () => {
          i += 2;
          const done = i >= tokens.length;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === replyId ? { ...msg, thinking: false, text: tokens.slice(0, i).join("") } : msg
            )
          );
          if (done) setBusy(false);
          else later(step, 35 + Math.random() * 70);
        };
        step();
      }, 700 + Math.random() * 900);
    },
    [busy]
  );

  const toggle = () => {
    setTeaser(false);
    setOpen((o) => !o);
  };

  return (
    <div className={`shiba-chat ${visible ? "shiba-chat-visible" : ""}`}>
      {/* The dog lives in an aria-hidden canvas, so keyboard and screen
          reader users get a real button; it only shows when focused. */}
      <button className="shiba-kbd-toggle" onClick={toggle} aria-expanded={open}>
        {open ? "Close Shiba-GPT chat" : "Chat with Shiba-GPT, Kenny's AI assistant"}
      </button>

      {teaser && !open && (
        <button className="shiba-teaser" ref={teaserRef} onClick={toggle}>
          Hi! 👋 I'm Kenny's AI assistant. Click me to chat!
        </button>
      )}

      {open && (
        <section className="shiba-panel" ref={panelRef} role="dialog" aria-label="Shiba-GPT chat">
          <header className="shiba-head">
            <span className="shiba-avatar" aria-hidden="true">🐕</span>
            <div className="shiba-head-text">
              <span className="shiba-title">
                SHIBA-GPT <span className="shiba-badge">BETA</span>
              </span>
              <span className="shiba-status">
                <span className="shiba-dot" /> online · model: shiba-4o-woof
              </span>
            </div>
            <button className="shiba-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>

          <div className="shiba-log" ref={logRef} aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`shiba-msg shiba-msg-${m.from}`}>
                {m.thinking ? (
                  <span className="shiba-typing" aria-label="Shiba-GPT is thinking">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  m.text
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="shiba-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="shiba-chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="shiba-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              className="shiba-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Kenny…"
              maxLength={300}
              aria-label="Message Shiba-GPT"
            />
            <button className="shiba-send" type="submit" disabled={busy || !input.trim()} aria-label="Send">
              ↑
            </button>
          </form>
          <p className="shiba-disclaimer">Shiba-GPT can make mistakes. Mostly it makes woofs.</p>
        </section>
      )}
    </div>
  );
}
