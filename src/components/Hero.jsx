import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useDragControls,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import "./Hero.css";

/* ---------- small helpers ---------- */

function useMedia(query) {
  const [match, setMatch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

// Wrap the first occurrence of each phrase in Instrument Serif italic.
function emphasize(text, phrases) {
  let parts = [text];
  phrases.forEach((ph) => {
    parts = parts.flatMap((p) => {
      if (typeof p !== "string") return [p];
      const i = p.indexOf(ph);
      if (i < 0) return [p];
      return [p.slice(0, i), <em className="serif" key={ph}>{ph}</em>, p.slice(i + ph.length)];
    });
  });
  return parts;
}

// Keep trailing initials together ("S K") so the name never orphans a single letter.
const glueInitials = (name) => name.replace(/ (\S)$/, " $1");

// Rubber-band a drag distance so handles stretch "a little" and resist more the further you pull.
const rubber = (d, max = 56) => Math.sign(d) * max * (1 - Math.exp(-Math.abs(d) / max));

/* ---------- selection box around the name ---------- */

const PAD = 12; // outline offset from the measured text box
const SPRING = { type: "spring", stiffness: 520, damping: 28, mass: 0.8 };
const CORNERS = ["tl", "tr", "bl", "br"];

function SelectedName({ name, canDrag }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);
  const dimRef = useRef(null);
  const [box, setBox] = useState(null);
  const [active, setActive] = useState(false);
  const controls = useDragControls();

  // outward stretch on each side, driven by the corner handles
  const L = useMotionValue(0);
  const T = useMotionValue(0);
  const R = useMotionValue(0);
  const B = useMotionValue(0);
  const top = useTransform(T, (v) => -(PAD + v));
  const left = useTransform(L, (v) => -(PAD + v));
  const right = useTransform(R, (v) => -(PAD + v));
  const bottom = useTransform(B, (v) => -(PAD + v));

  const boxRef = useRef(null);
  boxRef.current = box;

  const writeDim = () => {
    const b = boxRef.current;
    if (!b || !dimRef.current) return;
    const w = Math.round(b.w + L.get() + R.get());
    const h = Math.round(b.h + T.get() + B.get());
    dimRef.current.textContent = `W ${w} × H ${h}`;
  };

  // measure the real text extent (not the block box), so the outline hugs the glyphs
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const text = textRef.current;
    if (!wrap || !text) return;
    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(text);
      const r = range.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      setBox({ x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(text);
    document.fonts?.ready?.then(measure);
    return () => ro.disconnect();
  }, []);

  useEffect(writeDim, [box]);
  useEffect(() => {
    const subs = [L, T, R, B].map((mv) => mv.on("change", writeDim));
    return () => subs.forEach((u) => u());
  }, []);

  const startStretch = (corner) => (e) => {
    if (!canDrag) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture?.(e.pointerId);
    const sx = e.clientX;
    const sy = e.clientY;
    setActive(true);
    const move = (ev) => {
      const dx = rubber(ev.clientX - sx);
      const dy = rubber(ev.clientY - sy);
      if (corner[1] === "l") L.set(-dx); else R.set(dx);
      if (corner[0] === "t") T.set(-dy); else B.set(dy);
    };
    const up = () => {
      [L, T, R, B].forEach((mv) => animate(mv, 0, SPRING));
      setActive(false);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  return (
    <motion.div
      className={`hero-sel${canDrag ? " can-drag" : ""}${active ? " is-active" : ""}`}
      drag={canDrag}
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      dragElastic={0.16}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 24 }}
      onDragStart={() => setActive(true)}
      onDragEnd={() => setActive(false)}
    >
      <div className="hero-sel-inner" ref={wrapRef}>
        <h1
          ref={textRef}
          className="hero-name"
          onPointerDown={(e) => canDrag && controls.start(e)}
        >
          {glueInitials(name)}
        </h1>
        {box && (
          <div
            className="hero-sel-anchor"
            aria-hidden="true"
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          >
            <motion.div className="hero-sel-outline" style={{ top, left, right, bottom }}>
              {CORNERS.map((c) => (
                <span
                  key={c}
                  className={`hero-handle ${c}`}
                  onPointerDown={startStretch(c)}
                />
              ))}
              <span className="hero-dim">
                <span ref={dimRef} className="hero-dim-val">
                  W {Math.round(box.w)} × H {Math.round(box.h)}
                </span>
                {canDrag && <span className="hero-dim-hint">drag the handles</span>}
              </span>
              <span className="hero-sel-tag">Text · H1</span>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- collaborator cursors ---------- */

const CURSOR_COLORS = ["var(--pink)", "var(--warn)", "var(--select)", "var(--accent)", "var(--fg)"];

// Waypoints as fractions of the hero's width/height; each cursor keeps to its own corner of the board.
const PATHS = [
  { pts: [[0.74, 0.1], [0.9, 0.3], [0.66, 0.22], [0.86, 0.06]], clicks: [1, 3] },
  { pts: [[0.06, 0.6], [0.26, 0.76], [0.14, 0.66], [0.38, 0.62]], clicks: [2] },
  { pts: [[0.58, 0.46], [0.7, 0.62], [0.5, 0.72], [0.62, 0.4]], clicks: [1, 3] },
  { pts: [[0.42, 0.06], [0.24, 0.04], [0.56, 0.16], [0.34, 0.12]], clicks: [2] },
  { pts: [[0.92, 0.58], [0.78, 0.8], [0.94, 0.74], [0.82, 0.48]], clicks: [1] },
];
// on phones the content stacks, so keep the two cursors near the right edge and the top
const MOBILE_PATHS = [
  { pts: [[0.62, 0.05], [0.82, 0.12], [0.7, 0.03], [0.88, 0.08]], clicks: [1] },
  { pts: [[0.66, 0.44], [0.84, 0.52], [0.74, 0.4], [0.86, 0.47]], clicks: [2] },
];

function buildPath({ pts, clicks }, move, hold) {
  const xs = [], ys = [], press = [], rs = [], ro = [], t = [];
  let time = 0;
  const push = (p, pr, s, o) => {
    xs.push(`${p[0] * 100}%`);
    ys.push(`${p[1] * 100}%`);
    press.push(pr);
    rs.push(s);
    ro.push(o);
    t.push(time);
  };
  pts.forEach((p, i) => {
    if (i > 0) time += move;
    push(p, 1, 0.2, 0);
    if (clicks.includes(i)) {
      time += hold * 0.25; push(p, 0.84, 0.25, 0.9);
      time += hold * 0.45; push(p, 1, 1, 0);
      time += hold * 0.3; push(p, 1, 0.2, 0);
    } else {
      time += hold * 0.6; push(p, 1, 0.2, 0);
    }
  });
  time += move;
  push(pts[0], 1, 0.2, 0);
  return { xs, ys, press, rs, ro, times: t.map((v) => v / time), duration: time };
}

function Cursor({ label, color, path, index, still }) {
  const k = buildPath(path, 2.6 + index * 0.45, 1.2 + (index % 2) * 0.4);
  const loop = { duration: k.duration, times: k.times, ease: "easeInOut", repeat: Infinity, repeatType: "loop", delay: index * 0.35 };
  const ink = color === "var(--select)" ? "#fff" : "var(--bg)";

  if (still) {
    return (
      <div className="hero-cursor-track" style={{ transform: `translate(${k.xs[0]}, ${k.ys[0]})` }}>
        <CursorGlyph label={label} color={color} ink={ink} />
      </div>
    );
  }
  return (
    <motion.div
      className="hero-cursor-track"
      initial={{ x: k.xs[0], y: k.ys[0] }}
      animate={{ x: k.xs, y: k.ys }}
      transition={loop}
    >
      <motion.span
        className="hero-ripple"
        style={{ borderColor: color }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: k.rs, opacity: k.ro }}
        transition={loop}
      />
      <motion.div className="hero-cursor-press" animate={{ scale: k.press }} transition={loop}>
        <CursorGlyph label={label} color={color} ink={ink} />
      </motion.div>
    </motion.div>
  );
}

function CursorGlyph({ label, color, ink }) {
  return (
    <div className="hero-cursor">
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
        <path
          d="M2.5 1.8 L2.5 18.2 L6.9 14.1 L9.8 20.6 L12.9 19.3 L10.1 12.9 L16.2 12.9 Z"
          fill={color}
          stroke="#fff"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hero-cursor-tag" style={{ background: color, color: ink }}>{label}</span>
    </div>
  );
}

function Cursors({ names, small, still }) {
  const paths = small ? MOBILE_PATHS : PATHS;
  const list = names.slice(0, small ? 2 : paths.length);
  return (
    <div className="hero-cursors" aria-hidden="true">
      {list.map((n, i) => (
        <Cursor
          key={n}
          label={n}
          color={CURSOR_COLORS[i % CURSOR_COLORS.length]}
          path={paths[i % paths.length]}
          index={i}
          still={still}
        />
      ))}
    </div>
  );
}

/* ---------- stats: spec-sheet numbers that count up ---------- */

function Stat({ s, i, reduce }) {
  const ref = useRef(null);
  const numRef = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const fmt = (v) => v.toFixed(s.decimals || 0);

  useEffect(() => {
    if (!inView || !numRef.current) return;
    if (reduce) {
      numRef.current.textContent = fmt(s.value);
      return;
    }
    const c = animate(0, s.value, {
      duration: 1.5,
      delay: 0.1 + i * 0.09,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = fmt(v);
      },
    });
    return () => c.stop();
  }, [inView, reduce]);

  return (
    <li ref={ref} className="hero-stat">
      <span className="hero-stat-idx" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
      <span className="hero-stat-num" aria-hidden="true">
        {s.prefix && <span className="hero-stat-pre">{s.prefix}</span>}
        <span ref={numRef}>{reduce ? fmt(s.value) : fmt(0)}</span>
        {s.unit && <span className="hero-stat-unit">{s.unit}</span>}
      </span>
      <span className="hero-stat-label" aria-hidden="true">{s.label}</span>
      <span className="hero-sr">
        {s.label}: {s.prefix || ""}{fmt(s.value)}{s.unit ? ` ${s.unit}` : ""}
      </span>
    </li>
  );
}

/* ---------- hero ---------- */

export default function Hero({ person, stats = [], cursors = [] }) {
  const reduce = useReducedMotion();
  const small = useMedia("(max-width: 640px)");
  const fine = useMedia("(pointer: fine)");
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef);

  const meta = [
    ["now", person.now],
    ["edu", person.edu],
    ["before", person.before],
    ["city", person.city],
  ];

  return (
    <header id="top-hero" className="hero" ref={heroRef}>
      <Cursors names={cursors} small={small} still={reduce || !heroInView} />

      <div className="container hero-inner">
        <div className="hero-top">
          <span className="hero-status">
            <span className="hero-pulse" aria-hidden="true" />
            Open to: AI Generalist (Design) internship
          </span>
          <span className="hero-role">{person.role}</span>
        </div>

        <SelectedName name={person.name} canDrag={!small && fine && !reduce} />

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-line">{emphasize(person.line, ["friction", "remove it"])}</p>
            <p className="hero-sub">{person.sub}</p>
            <div className="hero-ctas">
              <a className="btn primary" href="#work">
                See the work
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M7 1.5v11M2.5 8l4.5 4.5L11.5 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a className="btn" href={`mailto:${person.email}`}>Email</a>
              <a className="btn" href={person.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn<span className="hero-sr"> (opens in a new tab)</span>
              </a>
              <a className="btn" href={person.github} target="_blank" rel="noopener noreferrer">
                GitHub<span className="hero-sr"> (opens in a new tab)</span>
              </a>
            </div>
          </div>

          <aside className="hero-side" aria-label="About">
            <figure className="hero-avatar">
              <figcaption className="frame-label">me.jpg</figcaption>
              <div className="hero-avatar-layer">
                <img src={person.photo} alt={`Portrait of ${person.name}`} width="320" height="320" decoding="async" />
              </div>
            </figure>
            <div className="hero-inspector">
              <div className="hero-inspector-head">
                <span>Properties</span>
                <span className="hero-inspector-type">{person.short}</span>
              </div>
              <dl>
                {meta.map(([k, v]) => (
                  <div className="hero-kv" key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        {stats.length > 0 && (
          <ul className="hero-stats" aria-label="At a glance">
            {stats.map((s, i) => (
              <Stat key={s.label} s={s} i={i} reduce={reduce} />
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
