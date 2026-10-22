import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import "./Work.css";

const pad = (n) => String(n).padStart(2, "0");
const isPhoto = (src = "") => src.startsWith("img/") || src.endsWith(".gif");
const fileOf = (src = "") => src.split("/").pop();
const hostOf = (href) => {
  try {
    return new URL(href).host;
  } catch {
    return "";
  }
};
const EASE = [0.2, 0.8, 0.2, 1];

// Split text into user-perceived characters so Tamil vowel signs never type out half-formed.
function graphemes(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter("ta", { granularity: "grapheme" }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

// All lightbox-able images for a case: hero first, then gallery.
function imagesOf(c) {
  const out = [];
  if (!c) return out;
  if (c.hero?.src) out.push({ src: c.hero.src, alt: c.hero.alt || c.title, cap: c.hero.cap });
  (c.gallery || []).forEach((g) => g?.src && out.push({ src: g.src, alt: g.alt || c.title }));
  return out;
}

export default function Work({ cases = [] }) {
  const [box, setBox] = useState(null); // { ci, ii }
  const close = useCallback(() => setBox(null), []);
  // step is relative (+1 / -1) and applied to the latest state, so fast key repeats never skip or stall
  const step = useCallback(
    (d) =>
      setBox((b) => {
        if (!b) return b;
        const n = imagesOf(cases[b.ci]).length;
        return n > 1 ? { ...b, ii: (b.ii + d + n) % n } : b;
      }),
    [cases]
  );
  const boxImages = box ? imagesOf(cases[box.ci]) : [];

  return (
    <section id="work" className="section work">
      <div className="container">
        <header className="work-head">
          <p className="eyebrow">Selected work</p>
          <h2 className="h2">
            Tools built for <em>the people doing the work</em>
          </h2>
          <p className="lede">
            Each project, opened like a file on the canvas: the friction, the tools tested, what shipped, and what it did.
          </p>
          <nav className="work-layers" aria-label="Case studies">
            <span className="work-layers-title" aria-hidden="true">
              Layers
            </span>
            <ol>
              {cases.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`}>
                    <span className="mono">{pad(i + 1)}</span>
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        <div className="cases">
          {cases.map((c, i) => (
            <Case key={c.id} c={c} index={i} onOpen={(ii) => setBox({ ci: i, ii })} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {box && boxImages.length > 0 && (
          <Lightbox
            key="lightbox"
            images={boxImages}
            index={box.ii}
            title={cases[box.ci]?.title}
            onStep={step}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ case */

function Case({ c, index, onOpen }) {
  const flip = index % 2 === 1;
  const mediaRef = useRef(null);
  const inspRef = useRef(null);
  const sticky = useStickyChoice(mediaRef, inspRef);
  const gallery = (c.gallery || []).filter((g) => g?.src);
  const heroCount = c.hero?.src ? 1 : 0;

  // App screenshots get the live address of the product; photos and recordings get their file name.
  let winName = "";
  if (c.hero?.src) {
    const live = (c.links || [])[0];
    winName = !isPhoto(c.hero.src) && live ? hostOf(live.href) || fileOf(c.hero.src) : fileOf(c.hero.src);
  }

  return (
    <article id={c.id} className={`case${flip ? " flip" : ""}`} aria-labelledby={`${c.id}-title`}>
      <div className="case-head">
        <div className="case-label">
          <p className="frame-label">
            Case {pad(index + 1)} — {c.title}
          </p>
          {c.tag && <span className="chip case-tag">{c.tag}</span>}
        </div>
        <h3 id={`${c.id}-title`} className="case-title">
          {c.title}
        </h3>
        {c.one && <p className="case-one">{c.one}</p>}
      </div>

      <div className="case-body" data-sticky={sticky}>
        <div className="case-media" ref={mediaRef}>
          {c.mock ? (
            <DeckMock mock={c.mock} />
          ) : c.hero?.src ? (
            <figure className="case-fig">
              <Shot
                img={c.hero}
                name={winName}
                ratio={isPhoto(c.hero.src) ? "4 / 3" : "16 / 10"}
                onOpen={() => onOpen(0)}
                parallax
              />
              {c.hero.cap && <figcaption className="cap">{c.hero.cap}</figcaption>}
            </figure>
          ) : null}

          {gallery.length > 0 && (
            <figure className={`case-gallery${gallery.length === 1 ? " single" : ""}`}>
              <div className="gallery-row">
                {gallery.map((g, gi) => (
                  <Shot
                    key={g.src}
                    img={g}
                    name={fileOf(g.src)}
                    ratio={isPhoto(g.src) ? "4 / 3" : "16 / 10"}
                    small
                    onOpen={() => onOpen(heroCount + gi)}
                  />
                ))}
              </div>
              {(c.galleryCap || gallery.length === 1) && (
                <figcaption className="cap">{c.galleryCap || gallery[0].alt}</figcaption>
              )}
            </figure>
          )}
        </div>

        <Inspector c={c} index={index} innerRef={inspRef} />
      </div>
    </article>
  );
}

// Desktop: let the shorter column stick while the taller one scrolls, but only if it fits the viewport.
function useStickyChoice(aRef, bRef) {
  const [choice, setChoice] = useState("none");
  useLayoutEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b || typeof ResizeObserver === "undefined") return;
    const decide = () => {
      if (window.innerWidth < 980) return setChoice("none");
      const ha = a.offsetHeight;
      const hb = b.offsetHeight;
      if (Math.abs(ha - hb) < 80) return setChoice("none");
      const h = Math.min(ha, hb);
      setChoice(h <= window.innerHeight - 120 ? (ha < hb ? "media" : "inspector") : "none");
    };
    const ro = new ResizeObserver(decide);
    ro.observe(a);
    ro.observe(b);
    window.addEventListener("resize", decide);
    decide();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", decide);
    };
  }, [aRef, bRef]);
  return choice;
}

/* ------------------------------------------------------------ app window */

function Handles() {
  return (
    <span className="handles" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function WinBar({ name, right }) {
  return (
    <div className="win-bar">
      <span className="win-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="win-addr">
        <span className="win-lock" aria-hidden="true" />
        <span className="win-name">{name}</span>
      </span>
      <span className="win-right" aria-hidden="true">
        {right}
      </span>
    </div>
  );
}

function Shot({ img, name, ratio, onOpen, parallax = false, small = false }) {
  const reduce = useReducedMotion();
  const portRef = useRef(null);
  const [dims, setDims] = useState("");
  const { scrollYProgress } = useScroll({ target: portRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.55, 1], [1.16, 1.04, 1.01]);
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const moving = parallax && !reduce;

  return (
    <div className={`win${small ? " win-sm" : ""}`}>
      <Handles />
      {dims && (
        <span className="win-size" aria-hidden="true">
          {dims}
        </span>
      )}
      <WinBar name={name} />
      <button type="button" className="win-view" onClick={onOpen} aria-label={`Enlarge image: ${img.alt}`}>
        <span ref={portRef} className="win-port" style={{ aspectRatio: ratio }}>
          <motion.img
            src={img.src}
            alt={img.alt || ""}
            loading="lazy"
            decoding="async"
            draggable="false"
            onLoad={(e) => setDims(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}`)}
            style={{ objectPosition: img.crop || "50% 0%", ...(moving ? { scale, y } : {}) }}
          />
          <span className="win-zoom" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="13" height="13">
              <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Enlarge
          </span>
        </span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- inspector */

function Inspector({ c, index, innerRef }) {
  const reduce = useReducedMotion();
  const rows = c.rows || [];
  const results = c.results || [];
  const links = c.links || [];
  const item = {
    // content stays visible even if the in-view trigger never fires; only the slide-in is animated
    hidden: reduce ? { opacity: 1 } : { opacity: 1, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };

  return (
    <motion.aside
      ref={innerRef}
      className="insp"
      aria-label={`${c.title}: details`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ staggerChildren: 0.07 }}
    >
      <div className="insp-top" aria-hidden="true">
        <span className="insp-tabs">
          <span className="on">Design</span>
          <span>Inspect</span>
        </span>
        <span className="insp-id">#{c.id}</span>
      </div>
      <div className="insp-sub" aria-hidden="true">
        <span className="insp-frame">
          <svg viewBox="0 0 12 12" width="11" height="11">
            <path d="M3 0v12M9 0v12M0 3h12M0 9h12" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Case {pad(index + 1)}
        </span>
        <span>
          {rows.length} props{results.length ? ` · ${results.length} specs` : ""}
        </span>
      </div>

      {rows.length > 0 && (
        <dl className="insp-rows">
          {rows.map((r, ri) => (
            <motion.div className="insp-row" key={r.k + ri} variants={item}>
              <dt>{r.k}</dt>
              <dd>
                {r.chips && (
                  <span className="chips insp-chips">
                    {r.chips.map((ch) => (
                      <span className="chip" key={ch}>
                        {ch}
                      </span>
                    ))}
                  </span>
                )}
                {r.list && (
                  <ul className="insp-list">
                    {r.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                )}
                {r.v && <p>{r.v}</p>}
              </dd>
            </motion.div>
          ))}
        </dl>
      )}

      {results.length > 0 && (
        <motion.div className="insp-block" variants={item}>
          <p className="insp-h">Results</p>
          <dl className={`specs${results.length === 1 ? " one" : ""}`}>
            {results.map((r, ri) => (
              <div className={`spec${ri === 0 ? " lead" : ""}`} key={r.label}>
                <dd>{r.value}</dd>
                <dt>{r.label}</dt>
              </div>
            ))}
          </dl>
        </motion.div>
      )}

      {links.length > 0 && (
        <motion.div className="insp-block" variants={item}>
          <p className="insp-h">Links</p>
          <div className="links">
            {links.map((l) => (
              <a key={l.href} className="btn link-pill" href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
                <span className="arr" aria-hidden="true">
                  ↗
                </span>
                <span className="w-sr"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}

/* ------------------------------------------------------- PolyDeck live mock */

function DeckMock({ mock }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.45 });
  const chars = useMemo(() => graphemes(mock.said || ""), [mock.said]);
  const bullets = mock.bullets || [];
  const nb = bullets.length;
  const DONE = 2 + nb;
  const [n, setN] = useState(0); // graphemes typed
  const [stage, setStage] = useState(0); // 0 listening · 1 writing · 2 title · 3.. bullets
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(chars.length);
      setStage(DONE);
      return undefined;
    }
    setN(0);
    setStage(0);
    if (!inView) return undefined;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    let t = 500;
    for (let i = 1; i <= chars.length; i++) {
      t += chars[i - 1] === " " ? 120 : 64;
      at(t, () => setN(i));
    }
    at((t += 450), () => setStage(1));
    at((t += 1150), () => setStage(2));
    t += 250;
    for (let b = 0; b < nb; b++) at((t += 400), () => setStage(3 + b));
    at((t += 4800), () => setRun((r) => r + 1));
    return () => timers.forEach(clearTimeout);
  }, [inView, run, reduce, chars, nb, DONE]);

  const typing = stage === 0;
  const done = stage >= DONE;
  const status = typing ? "Listening" : stage === 1 ? "Writing slides" : done ? "Deck ready" : "Building slide";

  return (
    <div className="mock-wrap">
      <div className="win win-mock" ref={ref}>
        <Handles />
        <WinBar name="polydeck · untitled deck" right={<span className={`rec${typing ? " on" : ""}`}>REC</span>} />
        <div
          className="mock"
          role="img"
          aria-label={`Animated mock of PolyDeck: the spoken Tamil sentence "${mock.said}" is transcribed, then becomes an English slide titled "${mock.slideTitle}" with the points: ${bullets.join("; ")}.`}
        >
          <div className="mock-grid" aria-hidden="true">
            <div className="mock-pane transcript">
              <div className="pane-h">
                <span>Transcript</span>
                <span className="lang">TA</span>
              </div>
              <div className="mic">
                <span className={`mic-dot${typing ? " live" : ""}`} />
                <span className={`wave${typing ? " go" : ""}`}>
                  {Array.from({ length: 18 }).map((_, i) => (
                    <i key={i} style={{ animationDelay: `${(i * 97) % 640}ms` }} />
                  ))}
                </span>
              </div>
              <p className="said" lang="ta">
                {chars.slice(0, n).join("")}
                <span className={`caret${typing ? "" : " idle"}`} />
              </p>
              <div className={`status${done ? " ok" : ""}${stage === 1 ? " busy" : ""}`}>
                <span className="status-dot" />
                {status}
              </div>
            </div>

            <div className={`mock-arrow${stage === 1 ? " flow" : ""}`}>
              <svg viewBox="0 0 48 12" width="48" height="12">
                <path className="track" d="M0 6h44" />
                <path className="pulse" d="M0 6h44" />
                <path d="M39 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="mock-pane deck">
              <div className="pane-h">
                <span>Slide 1</span>
                <span className="lang">EN</span>
              </div>
              <div className={`slide${stage >= 2 ? " built" : ""}${stage === 1 ? " thinking" : ""}`}>
                <div className="slide-skel">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="slide-content">
                  <AnimatePresence>
                    {stage >= 2 && (
                      <motion.p
                        key={`t${run}`}
                        className="slide-title"
                        initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.55, ease: EASE }}
                      >
                        {mock.slideTitle}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <ul className="slide-bullets">
                    <AnimatePresence>
                      {bullets.map(
                        (b, bi) =>
                          stage >= 3 + bi && (
                            <motion.li
                              key={`${run}-${b}`}
                              initial={reduce ? false : { opacity: 0, scale: 0.8, x: -10 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, transition: { duration: 0.2 } }}
                              transition={{ type: "spring", stiffness: 520, damping: 24 }}
                            >
                              {b}
                            </motion.li>
                          )
                      )}
                    </AnimatePresence>
                  </ul>
                </div>
              </div>
              <div className="deck-foot">
                <span className="thumbs">
                  <i className="on" />
                  <i />
                  <i />
                </span>
                <span className={`export${done ? " ready" : ""}`}>.pptx ↓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mock-cap">
        <p className="cap">Live mock: speak in Tamil, get the slide in English.</p>
        {!reduce && (
          <button type="button" className="replay" onClick={() => setRun((r) => r + 1)}>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M3 8a5 5 0 1 0 1.5-3.5M3 2.5V5h2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            Replay
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- lightbox */

const slide = {
  enter: ({ d, reduce }) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 70, scale: d ? 1 : 0.94 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: ({ d, reduce }) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -70, scale: d ? 1 : 0.96 }),
};

function Lightbox({ images, index, title, onStep, onClose }) {
  const reduce = useReducedMotion();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const [d, setD] = useState(0);
  const count = images.length;
  const i = Math.min(index, count - 1);
  const img = images[i];

  const go = useCallback(
    (step) => {
      if (count < 2) return;
      setD(step);
      onStep(step);
    },
    [count, onStep]
  );

  // focus in, scroll lock, focus back to the thumbnail on close
  useEffect(() => {
    const prev = document.activeElement;
    const html = document.documentElement;
    const gap = window.innerWidth - html.clientWidth;
    const prevOverflow = html.style.overflow;
    const prevPad = document.body.style.paddingRight;
    html.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
      if (prev && typeof prev.focus === "function") prev.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab") {
        const f = dialogRef.current ? [...dialogRef.current.querySelectorAll("button")] : [];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        const inside = dialogRef.current.contains(document.activeElement);
        if (!inside || (e.shiftKey && document.activeElement === first)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const stop = (e) => e.stopPropagation();

  return (
    <motion.div
      ref={dialogRef}
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: image ${i + 1} of ${count}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.22 }}
      onClick={onClose}
    >
      <div className="lb-top">
        <span className="lb-meta">
          <span className="lb-title">{title}</span>
          <span className="lb-count">
            {pad(i + 1)} / {pad(count)}
          </span>
        </span>
        <button ref={closeRef} type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Close image viewer">
          <kbd aria-hidden="true">Esc</kbd>
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </button>
      </div>

      <div className="lb-stage">
        <AnimatePresence initial={false} mode="popLayout" custom={{ d, reduce }}>
          <motion.figure
            key={img.src}
            className="lb-fig"
            custom={{ d, reduce }}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 34, mass: 0.8 }}
          >
            <img src={img.src} alt={img.alt} />
            {(img.cap || img.alt) && <figcaption className="cap">{img.cap || img.alt}</figcaption>}
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="lb-foot">
        {count > 1 && (
          <div className="lb-nav" onClick={stop}>
            <button type="button" className="lb-btn" onClick={() => go(-1)} aria-label="Previous image">
              <span aria-hidden="true">←</span>
            </button>
            <span className="lb-dots" aria-hidden="true">
              {images.map((im, k) => (
                <i key={im.src} className={k === i ? "on" : ""} />
              ))}
            </span>
            <button type="button" className="lb-btn" onClick={() => go(1)} aria-label="Next image">
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
        <p className="lb-hint" aria-hidden="true">
          Click anywhere to close{count > 1 ? " · ← → to browse" : ""}
        </p>
      </div>
    </motion.div>
  );
}
