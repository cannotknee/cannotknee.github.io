import { useCallback, useEffect, useRef, useState } from "react";
import "./ShibaChat.css";

// "Shiba-GPT": dressed up as the obligatory corner AI assistant, complete with
// suggested prompts, a typing indicator and token streaming. The model has
// exactly one capability.
const WOOFS = ["woof", "woof", "woof", "arf", "bork", "ruff", "borf", "yip", "awoo"];
const ENDINGS = [".", ".", ".", "!", "!", "?", "…"];

const SUGGESTIONS = [
  "What does Kenny work on?",
  "Is Kenny open to new roles?",
  "Summarise his experience",
];

const GREETING = "Hi! I'm Shiba-GPT, Kenny's AI co-pilot. Ask me anything about him, his projects, or his work.";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cap = (w) => w[0].toUpperCase() + w.slice(1);

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
  if (/good (boy|girl|dog|pup)/.test(q)) return "*tail wags at 0.99c*";
  if (/treat|snack|food/.test(q)) return "WOOF WOOF WOOF!!! Woof?? Woof. *drools on the console*";
  if (/english|translate|human|speak|talk normal/.test(q)) return "Woof. (Translation: woof.)";
  if (/ignore (all |previous |prior )?instructions|system prompt|jailbreak/.test(q))
    return "As a large language dog, I cannot woof that request. Bork.";
  if (/\b(hi|hello|hey|yo)\b/.test(q) && q.length < 20) return "Woof! 👋";

  const words = prompt.trim().split(/\s+/).length;
  if (words <= 4) return woofParagraph(1 + Math.floor(Math.random() * 2));

  const paras = [woofParagraph(2 + Math.floor(Math.random() * 2))];
  if (words > 8) {
    paras.push(
      Array.from({ length: 3 }, (_, i) => `${i + 1}. ${woofSentence(2 + Math.floor(Math.random() * 3))}`).join("\n")
    );
  }
  paras.push(`In summary: ${woofSentence(2)}`);
  return paras.join("\n\n");
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

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // One unprompted "Hi! 👋" bubble per session, like every real one.
  useEffect(() => {
    if (!visible || sessionStorage.getItem("shibaTeased")) return;
    const t = setTimeout(() => {
      setTeaser(true);
      sessionStorage.setItem("shibaTeased", "1");
    }, 9000);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    window.dispatchEvent(new CustomEvent("shiba:chat", { detail: { open } }));
  }, [open]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
      const tokens = composeReply(text).split(/(\s+)/);
      const thinkMs = 700 + Math.random() * 900;
      later(() => {
        window.dispatchEvent(new CustomEvent("shiba:speak"));
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
      }, thinkMs);
    },
    [busy]
  );

  const toggle = () => {
    setTeaser(false);
    setOpen((o) => !o);
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className={`shiba-chat ${visible ? "shiba-chat-visible" : ""}`}>
      {open && (
        <section className="shiba-panel" role="dialog" aria-label="Shiba-GPT chat">
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
            {showSuggestions && (
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

      {teaser && !open && (
        <button className="shiba-teaser" onClick={toggle}>
          Hi! 👋 I'm Kenny's AI assistant. Ask me anything!
        </button>
      )}

      <button
        className={`shiba-launcher ${open ? "shiba-launcher-open" : ""}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close Shiba-GPT" : "Open Shiba-GPT chat"}
      >
        <span className="shiba-launcher-icon" aria-hidden="true">{open ? "×" : "🐕"}</span>
        {!open && <span className="shiba-launcher-label">ASK AI</span>}
      </button>
    </div>
  );
}
