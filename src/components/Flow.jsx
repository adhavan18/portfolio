import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  frame,
  cancelFrame,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import "./Flow.css";

// Resting positions (px from the top of the board) for the two canvas layouts.
const TOP_WIDE = [28, 132, 52, 150, 36]; // >=1000px: one gently staggered row

const SPRING = { type: "spring", stiffness: 260, damping: 26 };

function useMedia(query) {
  const get = () => typeof window !== "undefined" && window.matchMedia(query).matches;
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

function splitIO(io = "") {
  const [a, b] = io.split("→").map((s) => s.trim());
  return b === undefined ? [io, ""] : [a, b];
}

function Node({ step, i, last, canvas, boardRef, onMove, onGrab, z, resetKey, shown, reduce, setRef }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  useMotionValueEvent(x, "change", onMove);
  useMotionValueEvent(y, "change", onMove);

  useEffect(() => {
    if (!resetKey) return;
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  }, [resetKey, x, y]);

  useEffect(() => {
    if (!canvas) {
      x.set(0);
      y.set(0);
    }
  }, [canvas, x, y]);

  const [input, output] = splitIO(step.io);
  const num = String(i + 1).padStart(2, "0");

  return (
    <motion.article
      ref={(el) => setRef("node", i, el)}
      className="flow-node"
      style={{
        x,
        y,
        zIndex: z,
        "--i": i,
        "--last": last,
        "--top-wide": `${TOP_WIDE[i % TOP_WIDE.length]}px`,
      }}
      initial={reduce ? false : { opacity: 0, scale: 0.94 }}
      animate={shown || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
      transition={{ ...SPRING, delay: reduce ? 0 : 0.08 * i }}
      onUpdate={onMove}
      drag={canvas}
      dragConstraints={boardRef}
      dragElastic={0.12}
      dragMomentum
      dragTransition={{ power: 0.18, timeConstant: 220, bounceStiffness: 420, bounceDamping: 28 }}
      whileDrag={{ scale: 1.035 }}
      onPointerDown={() => canvas && onGrab(i)}
      aria-labelledby={`flow-${step.id}`}
    >
      <span className="flow-port flow-port--in" ref={(el) => setRef("in", i, el)} aria-hidden="true" />
      <span className="flow-port flow-port--out" ref={(el) => setRef("out", i, el)} aria-hidden="true" />

      <header className="flow-node__head">
        <span className="flow-node__num">{num}</span>
        <h3 className="flow-node__title" id={`flow-${step.id}`}>{step.title}</h3>
      </header>
      <p className="flow-node__text">{step.text}</p>
      <p className="flow-node__io">
        <span className="flow-node__io-k" aria-hidden="true">io</span>
        <span>{input}</span>
        {output && (
          <>
            <span className="flow-node__arrow" aria-label="to">→</span>
            <span className="flow-node__out">{output}</span>
          </>
        )}
      </p>
    </motion.article>
  );
}

export default function Flow({ steps = [] }) {
  const reduce = useReducedMotion();
  const canvas = useMedia("(min-width: 760px)");
  const boardRef = useRef(null);
  const dotRef = useRef(null);
  const refs = useRef({ node: [], in: [], out: [], wire: [], glow: [] });
  const pending = useRef(false);

  const shown = useInView(boardRef, { once: true, amount: 0.3 });
  const live = useInView(boardRef, { amount: 0.05 });

  const [order, setOrder] = useState(() => steps.map((_, i) => i));
  const [resetKey, setResetKey] = useState(0);
  const [moved, setMoved] = useState(false);

  const n = steps.length;
  const last = Math.max(1, n - 1);

  const setRef = useCallback((kind, i, el) => {
    refs.current[kind][i] = el;
  }, []);

  // Measure every port from the DOM and redraw the wires between them.
  const update = useCallback(() => {
    pending.current = false;
    const board = boardRef.current;
    if (!board) return;
    const br = board.getBoundingClientRect();
    const vertical = !window.matchMedia("(min-width: 1000px)").matches;
    const c = (el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2 - br.left, r.top + r.height / 2 - br.top];
    };
    const { in: ins, out: outs, wire, glow } = refs.current;
    for (let k = 0; k < n - 1; k++) {
      if (!outs[k] || !ins[k + 1] || !wire[k]) continue;
      const [x1, y1] = c(outs[k]);
      const [x2, y2] = c(ins[k + 1]);
      let d;
      if (vertical) {
        const h = Math.max(20, Math.abs(y2 - y1) * 0.5);
        d = `M${x1},${y1} C${x1},${y1 + h} ${x2},${y2 - h} ${x2},${y2}`;
      } else {
        const dx = x2 - x1;
        const h = dx > 0 ? Math.max(28, dx * 0.55) : Math.max(60, Math.min(Math.abs(y2 - y1) * 0.45, 130));
        d = `M${x1},${y1} C${x1 + h},${y1} ${x2 - h},${y2} ${x2},${y2}`;
      }
      wire[k].setAttribute("d", d);
      if (glow[k]) glow[k].setAttribute("d", d);
    }
  }, [n]);

  // At most one measurement per frame, after framer-motion has written its transforms.
  const schedule = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    frame.postRender(update);
  }, [update]);

  useEffect(() => {
    update();
    const ro = new ResizeObserver(schedule);
    if (boardRef.current) ro.observe(boardRef.current);
    refs.current.node.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      cancelFrame(update);
      pending.current = false;
    };
  }, [update, schedule, canvas]);

  // The data packet: rest on a node, travel the wire, rest on the next one, loop.
  useEffect(() => {
    if (reduce || !shown || !live || n < 2) return;
    const DWELL = 520;
    const TRAVEL = 1100;
    const PAUSE = 900;
    const cycle = n * DWELL + (n - 1) * TRAVEL + PAUSE;
    const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
    const { node, glow } = refs.current;
    const start = performance.now() + 700 + n * 160; // let the wires finish drawing
    let raf = 0;

    const paint = (hotNode, hotWire, pt) => {
      node.forEach((el, k) => el && el.classList.toggle("is-hot", k === hotNode));
      glow.forEach((el, k) => el && el.classList.toggle("is-lit", k === hotWire));
      const dot = dotRef.current;
      if (!dot) return;
      if (pt) {
        dot.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        dot.style.opacity = "1";
      } else {
        dot.style.opacity = "0";
      }
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const elapsed = now - start;
      if (elapsed < 0) return;
      let t = elapsed % cycle;
      for (let k = 0; k < n; k++) {
        if (t < DWELL) return paint(k, -1, null);
        t -= DWELL;
        if (k === n - 1) break;
        if (t < TRAVEL) {
          const path = glow[k];
          if (path && path.getAttribute("d")) {
            paint(-1, k, path.getPointAtLength(ease(t / TRAVEL) * path.getTotalLength()));
          }
          return;
        }
        t -= TRAVEL;
      }
      paint(-1, -1, null);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      paint(-1, -1, null);
    };
  }, [reduce, shown, live, n]);

  const grab = useCallback((i) => {
    setMoved(true);
    setOrder((o) => [...o.filter((k) => k !== i), i]);
  }, []);

  const reset = () => {
    setResetKey((k) => k + 1);
    setMoved(false);
  };

  return (
    <section id="process" className="section flow">
      <div className="container">
        <p className="eyebrow">How I work</p>
        <h2 className="h2">
          From complaint to <em>a tool people use</em>
        </h2>
        <p className="lede">The same steps on every project. Each step's output is the next step's input.</p>

        <div className="flow-bar">
          <span className="frame-label flow-bar__label">workflow · {n} nodes</span>
          {canvas && (
            <span className="flow-bar__tools">
              <span className="flow-hint" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 1l8 4.2-3.6.9L4.7 10z" fill="currentColor" />
                </svg>
                drag the nodes
              </span>
              <button
                type="button"
                className="flow-reset"
                onClick={reset}
                disabled={!moved}
                aria-label="Reset node positions"
              >
                ↺ reset
              </button>
            </span>
          )}
        </div>

        <div ref={boardRef} className={`flow-board${shown || reduce ? " is-drawn" : ""}`}>
          <svg className="flow-wires" aria-hidden="true" focusable="false">
            {steps.slice(0, -1).map((s, k) => (
              <g key={s.id} style={{ "--k": k }}>
                <path ref={(el) => setRef("wire", k, el)} className="flow-wire" pathLength="1" />
                <path ref={(el) => setRef("glow", k, el)} className="flow-wire-glow" />
              </g>
            ))}
            <g ref={dotRef} className="flow-packet" style={{ opacity: 0 }}>
              <circle r="12" className="flow-packet__halo" />
              <circle r="4.5" className="flow-packet__core" />
            </g>
          </svg>

          {steps.map((step, i) => (
            <Node
              key={step.id}
              step={step}
              i={i}
              last={last}
              canvas={canvas}
              boardRef={boardRef}
              onMove={schedule}
              onGrab={grab}
              z={2 + order.indexOf(i)}
              resetKey={resetKey}
              shown={shown}
              reduce={reduce}
              setRef={setRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
