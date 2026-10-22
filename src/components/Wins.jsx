import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import "./Wins.css";

/* ---------- helpers ---------- */

// tiny seeded PRNG so the "random" scatter is the same on every load
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useMedia(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      setSize((s) => (w === s.w && h === s.h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const TABLE_H = 600;
const CAP_H = 40; // polaroid height = width + caption strip

function cardWidth(W) {
  return Math.round(Math.max(150, Math.min(208, W * 0.18)));
}

// jittered grid with shuffled slots: reads as a messy pile, but nothing is ever fully hidden
function scatter(n, W, H, seed) {
  const rnd = mulberry32(seed * 9301 + 49297);
  const cw = cardWidth(W);
  const ch = cw + CAP_H;
  const cols = W >= 900 ? 5 : 4;
  const rows = Math.ceil(n / cols);
  const spanX = Math.max(0, W - cw);
  const spanY = Math.max(0, H - ch);
  const slots = Array.from({ length: n }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots.map((s) => {
    const col = s % cols;
    const row = Math.floor(s / cols);
    const bx = cols > 1 ? (col / (cols - 1)) * spanX : spanX / 2;
    const by = rows > 1 ? (row / (rows - 1)) * spanY : spanY / 2;
    const jx = (rnd() * 2 - 1) * (spanX / cols) * 0.32;
    const jy = (rnd() * 2 - 1) * 46;
    return {
      x: Math.round(Math.min(spanX, Math.max(0, bx + jx))),
      y: Math.round(Math.min(spanY, Math.max(0, by + jy))),
      r: Math.round((rnd() * 2 - 1) * 110) / 10,
    };
  });
}

// the stacked deck the photos are dealt from before the table scrolls into view
function stacked(n, W, H) {
  const rnd = mulberry32(3);
  const cw = cardWidth(W);
  const ch = cw + CAP_H;
  return Array.from({ length: n }, () => ({
    x: Math.round((W - cw) / 2 + (rnd() * 2 - 1) * 6),
    y: Math.round((H - ch) / 2 + (rnd() * 2 - 1) * 6),
    r: Math.round((rnd() * 2 - 1) * 6),
  }));
}

/* ---------- polaroid on the table ---------- */

function Polaroid({ photo, index, target, z, selected, cw, ch, bounds, reduce, delay, onGrab, onOpen }) {
  const x = useMotionValue(target.x);
  const y = useMotionValue(target.y);
  const rotate = useMotionValue(target.r);
  const moved = useRef(false);

  useEffect(() => {
    const opts = reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 19, mass: 0.9, delay };
    const runs = [animate(x, target.x, opts), animate(y, target.y, opts), animate(rotate, target.r, opts)];
    return () => runs.forEach((r) => r.stop());
  }, [target.x, target.y, target.r, reduce, delay, x, y, rotate]);

  // keyboard users can move photos too
  const nudge = (e) => {
    const step = e.shiftKey ? 40 : 12;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    onGrab(index);
    const nx = Math.min(bounds.w - cw, Math.max(0, x.get() + d[0]));
    const ny = Math.min(bounds.h - ch, Math.max(0, y.get() + d[1]));
    const opts = reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 };
    animate(x, nx, opts);
    animate(y, ny, opts);
  };

  return (
    <motion.button
      type="button"
      className={`polaroid${selected ? " is-selected" : ""}`}
      style={{ x, y, rotate, zIndex: z, width: cw }}
      drag
      dragConstraints={bounds.ref}
      dragElastic={0.12}
      dragTransition={{ power: 0.22, timeConstant: 220, bounceStiffness: 380, bounceDamping: 26 }}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      whileDrag={reduce ? undefined : { scale: 1.06 }}
      onPointerDown={() => {
        moved.current = false;
        onGrab(index);
      }}
      onDragStart={() => {
        moved.current = true;
      }}
      onClick={(e) => {
        if (moved.current) return;
        onOpen(index, e.currentTarget);
      }}
      onKeyDown={nudge}
      aria-label={`${photo.cap}. Open photo. Arrow keys move it on the table.`}
    >
      <span className="polaroid-img">
        <img src={photo.src} alt="" width="400" height="400" loading="lazy" draggable="false" />
      </span>
      <span className="polaroid-cap">{photo.cap}</span>
      {selected && (
        <>
          <span className="handles" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="polaroid-size mono" aria-hidden="true">
            {cw} × {ch}
          </span>
        </>
      )}
    </motion.button>
  );
}

/* ---------- lightbox ---------- */

function Lightbox({ photos, index, onClose, onStep, reduce }) {
  const closeRef = useRef(null);
  const boxRef = useRef(null);
  const open = index !== null;
  const photo = open ? photos[index] : null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
      else if (e.key === "Tab") {
        const f = boxRef.current?.querySelectorAll("button");
        if (!f || !f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (!boxRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose, onStep]);

  const spring = reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="lbx"
          role="dialog"
          aria-modal="true"
          aria-label={photo.cap}
          ref={boxRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.figure
            key={index}
            className="lbx-figure"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12, rotate: -1.5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            transition={spring}
          >
            <img src={photo.src} alt={photo.cap} />
            <figcaption>
              <span className="serif">{photo.cap}</span>
              <span className="mono lbx-count">
                {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
              </span>
            </figcaption>
          </motion.figure>
          <div className="lbx-controls">
            <button type="button" className="lbx-btn" onClick={() => onStep(-1)} aria-label="Previous photo">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="lbx-btn" onClick={() => onStep(1)} aria-label="Next photo">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="lbx-btn" onClick={onClose} ref={closeRef} aria-label="Close photo">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- the table (>= 640px) ---------- */

function PhotoTable({ photos, reduce, onOpen }) {
  const tableRef = useRef(null);
  const { w } = useSize(tableRef);
  const inView = useInView(tableRef, { once: true, margin: "0px 0px -20% 0px" });
  const [seed, setSeed] = useState(7);
  const [order, setOrder] = useState(() => photos.map((_, i) => i));
  const [active, setActive] = useState(null);

  const W = w || 960;
  const H = TABLE_H;
  const cw = cardWidth(W);
  const ch = cw + CAP_H;
  const dealt = inView || reduce;
  const targets = dealt ? scatter(photos.length, W, H, seed) : stacked(photos.length, W, H);
  const bounds = { ref: tableRef, w: W, h: H };

  const grab = useCallback((i) => {
    setActive(i);
    setOrder((o) => (o[o.length - 1] === i ? o : [...o.filter((k) => k !== i), i]));
  }, []);

  const shuffle = () => {
    setSeed((s) => s + 1);
    setActive(null);
  };

  return (
    <div className="table-wrap">
      <div className="table-bar">
        <p className="frame-label">Table · drag the photos around</p>
        <button type="button" className="btn shuffle" onClick={shuffle}>
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M3 6h3.2c1.6 0 2.6.7 3.5 2l1.6 2.4c.9 1.3 1.9 2 3.5 2H17M14.5 10.5 17 12.6l-2.5 2.2M3 14h3.2c1 0 1.7-.3 2.3-.8M11.5 6.8c.6-.5 1.3-.8 2.3-.8H17M14.5 3.8 17 6l-2.5 2.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shuffle
        </button>
      </div>
      <div
        className="table"
        ref={tableRef}
        style={{ height: H }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setActive(null);
        }}
      >
        {w > 0 &&
          photos.map((p, i) => (
            <Polaroid
              key={p.src}
              photo={p}
              index={i}
              target={targets[i]}
              z={order.indexOf(i) + 1}
              selected={active === i}
              cw={cw}
              ch={ch}
              bounds={bounds}
              reduce={reduce}
              delay={dealt && seed === 7 && !reduce ? 0.06 * i : 0}
              onGrab={grab}
              onOpen={onOpen}
            />
          ))}
        <span className="table-hint mono" aria-hidden="true">
          {photos.length} photos · click one to open
        </span>
      </div>
    </div>
  );
}

/* ---------- the strip (< 640px) ---------- */

function PhotoStrip({ photos, onOpen }) {
  const rnd = mulberry32(11);
  return (
    <div className="strip-wrap">
      <p className="frame-label">Photos · swipe</p>
      <ul className="strip" aria-label="Prize photos">
        {photos.map((p, i) => (
          <li key={p.src} style={{ "--tilt": `${((rnd() * 2 - 1) * 3).toFixed(1)}deg` }}>
            <button type="button" className="polaroid polaroid-static" onClick={(e) => onOpen(i, e.currentTarget)} aria-label={`${p.cap}. Open photo.`}>
              <span className="polaroid-img">
                <img src={p.src} alt="" width="400" height="400" loading="lazy" />
              </span>
              <span className="polaroid-cap">{p.cap}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- leaderboard ---------- */

function Leaderboard({ wins }) {
  return (
    <div className="board-wrap">
      <p className="frame-label">Leaderboard</p>
      <div className="lb-head mono" aria-hidden="true">
        <span>#</span>
        <span>Event</span>
        <span>When</span>
        <span>Prize</span>
      </div>
      <ol className="lb-list">
        {wins.map((w, i) => {
          const inner = (
            <>
              <span className="lb-rank mono" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="lb-main">
                <h3 className="lb-title">
                  {w.title}
                  {w.href && (
                    <span className="lb-ext" aria-hidden="true">
                      {" "}↗
                    </span>
                  )}
                </h3>
                <span className="lb-sub">{w.sub}</span>
              </span>
              <span className="lb-side mono">{w.side}</span>
              <span className={`lb-prize mono${w.prize ? "" : " is-empty"}`}>
                {w.prize ? w.prize : <span aria-hidden="true">—</span>}
              </span>
            </>
          );
          return (
            <li key={w.title}>
              {w.href ? (
                <a className="lb-row is-link" href={w.href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div className="lb-row">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="lb-note">
        Prize amounts come from the cheques and certificates. The ₹1.1 lakh total counts only teams I was on.
      </p>
    </div>
  );
}

/* ---------- contact ---------- */

function Contact({ person, reduce }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const btnRef = useRef(null);
  const { w } = useSize(btnRef);

  const copy = async () => {
    const ok = await copyText(person.email);
    if (!ok) {
      window.location.href = `mailto:${person.email}`;
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <p className="eyebrow">Contact</p>
        <h2 className="h2 contact-h">
          Let's make the design team's <em>day easier</em>
        </h2>

        <div className="email-zone">
          <div className="email-measure mono" aria-hidden="true" style={{ width: w || undefined }}>
            <span className="measure-line" />
            <span className="measure-label">{w || "—"} px</span>
          </div>
          <motion.button
            ref={btnRef}
            type="button"
            className="email-btn"
            onClick={copy}
            whileTap={reduce ? undefined : { scale: 0.975 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label={`Copy email address ${person.email}`}
          >
            <span className="email-text">{person.email}</span>
            <span className="email-icon" aria-hidden="true">
              {copied ? (
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                  <path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                  <rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </span>
            <AnimatePresence>
              {copied && (
                <motion.span
                  className="toast mono"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
                  aria-hidden="true"
                >
                  Copied ✓
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <p className="email-hint mono">
            Click to copy · or{" "}
            <a href={`mailto:${person.email}`} className="email-mailto">
              open your mail app
            </a>
          </p>
          <span className="wins-sr" role="status" aria-live="polite">
            {copied ? "Email address copied" : ""}
          </span>
        </div>

        <div className="contact-links">
          <a className="btn" href={person.linkedin} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.83-1.75 3.36-1.75 3.6 0 4.28 2.2 4.28 5.06v6.19h-4v-5.48c0-1.31-.03-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9v5.58h-4V9.75Z" /></svg>
            LinkedIn
          </a>
          <a className="btn" href={person.github} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
            GitHub
          </a>
          <span className="contact-city mono">{person.city}</span>
        </div>

        <footer className="foot mono">Tamil Adhavan S K · SRM Institute of Science and Technology · 2026</footer>
      </div>
    </section>
  );
}

/* ---------- section ---------- */

export default function Wins({ photos = [], wins = [], person }) {
  const reduce = useReducedMotion();
  const small = useMedia("(max-width: 639px)");
  const [open, setOpen] = useState(null);
  const opener = useRef(null);

  const openAt = useCallback((i, el) => {
    opener.current = el || null;
    setOpen(i);
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    const el = opener.current;
    if (el) requestAnimationFrame(() => el.focus({ preventScroll: true }));
  }, []);
  const step = useCallback((d) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  return (
    <>
      <section id="wins" className="section wins">
        <div className="container">
          <p className="eyebrow">Recognition</p>
          <h2 className="h2">
            Built under pressure, <em>judged by juries</em>
          </h2>

          {photos.length > 0 &&
            (small ? <PhotoStrip photos={photos} onOpen={openAt} /> : <PhotoTable photos={photos} reduce={reduce} onOpen={openAt} />)}

          <Leaderboard wins={wins} />
        </div>
        <Lightbox photos={photos} index={open} onClose={close} onStep={step} reduce={reduce} />
      </section>
      {person && <Contact person={person} reduce={reduce} />}
    </>
  );
}
