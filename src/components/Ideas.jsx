import { useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import "./Ideas.css";

const TILT = [-2.6, 1.8, -1.4, 2.4, -2, 1.2];
// Resting spots: 4 across on wide screens, 2x2 on medium. Fractions of the free width, px from top.
const SPOT4 = [
  { x: 0, y: 34 },
  { x: 1 / 3, y: 88 },
  { x: 2 / 3, y: 14 },
  { x: 1, y: 70 },
];
const SPOT2 = [
  { x: 0.02, y: 24 },
  { x: 0.98, y: 64 },
  { x: 0.06, y: 410 },
  { x: 0.94, y: 440 },
];

const SPRING = { type: "spring", stiffness: 240, damping: 24 };

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

function Note({ idea, i, board, canDrag, reduce, z, onGrab, resetKey }) {
  const base = TILT[i % TILT.length];
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // the note swings a little in the direction it is thrown, then settles
  const vx = useVelocity(x);
  const swing = useSpring(useTransform(vx, [-1600, 0, 1600], [-9, 0, 9], { clamp: true }), {
    stiffness: 260,
    damping: 18,
  });
  const rotate = useTransform(swing, (s) => (canDrag ? base + s : base * 0.4));

  useEffect(() => {
    if (!resetKey) return;
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  }, [resetKey, x, y]);

  useEffect(() => {
    if (!canDrag) {
      x.set(0);
      y.set(0);
    }
  }, [canDrag, x, y]);

  const s4 = SPOT4[i % SPOT4.length];
  const s2 = SPOT2[i % SPOT2.length];

  return (
    <motion.article
      className="note"
      style={{
        x,
        y,
        rotate: reduce ? base * (canDrag ? 1 : 0.4) : rotate,
        zIndex: z,
        "--note": idea.color,
        "--x4": s4.x,
        "--y4": `${s4.y}px`,
        "--x2": s2.x,
        "--y2": `${s2.y}px`,
      }}
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...SPRING, delay: reduce ? 0 : 0.07 * i }}
      drag={canDrag}
      dragConstraints={board}
      dragElastic={0.18}
      dragMomentum
      dragTransition={{ power: 0.25, timeConstant: 260, bounceStiffness: 380, bounceDamping: 22 }}
      whileDrag={{
        scale: 1.05,
        boxShadow: "0 40px 70px -24px rgba(0,0,0,.85), 0 14px 26px -12px rgba(0,0,0,.6)",
        cursor: "grabbing",
      }}
      onPointerDown={() => canDrag && onGrab(i)}
      aria-labelledby={`idea-${i}`}
    >
      <span className="note__tape" aria-hidden="true" />
      <span className="note__who">{idea.who}</span>
      <h3 className="note__title" id={`idea-${i}`}>{idea.title}</h3>
      <p className="note__text">{idea.text}</p>
      <p className="note__how">{idea.how}</p>
    </motion.article>
  );
}

export default function Ideas({ ideas = [] }) {
  const reduce = useReducedMotion();
  const canDrag = useMedia("(min-width: 640px)");
  const boardRef = useRef(null);
  const [order, setOrder] = useState(() => ideas.map((_, i) => i));
  const [resetKey, setResetKey] = useState(0);
  const [moved, setMoved] = useState(false);

  const grab = (i) => {
    setMoved(true);
    setOrder((o) => (o[o.length - 1] === i ? o : [...o.filter((k) => k !== i), i]));
  };

  return (
    <section id="ideas" className="section ideas">
      <div className="container">
        <p className="eyebrow">First-month hypotheses</p>
        <h2 className="h2">
          Where I'd start <em>looking at Ather</em>
        </h2>
        <p className="lede">
          These are guesses until I talk to the designers. The job starts with listening: sitting with each team,
          watching where the hours actually go, and only then picking what to build.
        </p>

        <div className="ideas-bar">
          <span className="frame-label ideas-bar__label">board · hypotheses</span>
          {canDrag && (
            <span className="ideas-bar__tools">
              <span className="ideas-hint" aria-hidden="true">drag the notes</span>
              <button
                type="button"
                className="ideas-reset"
                onClick={() => {
                  setResetKey((k) => k + 1);
                  setMoved(false);
                }}
                disabled={!moved}
                aria-label="Tidy the notes back into place"
              >
                ↺ tidy
              </button>
            </span>
          )}
        </div>

        <div ref={boardRef} className="ideas-board">
          {ideas.map((idea, i) => (
            <Note
              key={idea.title}
              idea={idea}
              i={i}
              board={boardRef}
              canDrag={canDrag}
              reduce={reduce}
              z={1 + order.indexOf(i)}
              onGrab={grab}
              resetKey={resetKey}
            />
          ))}
        </div>

        <aside className="ideas-rule">
          <span className="ideas-rule__k">rule</span>
          <p>
            For each one: measure today's time, build the smallest version, ship it with a one-page guide, and keep
            it only if people use it in week two.
          </p>
        </aside>
      </div>
    </section>
  );
}
