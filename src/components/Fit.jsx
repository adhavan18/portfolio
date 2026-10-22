import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import "./Fit.css";

const EASE_OUT = [0.16, 1, 0.3, 1];

function CheckRow({ item, i, reduce, onPass }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  const on = reduce || inView;

  useEffect(() => {
    if (inView) onPass(i);
  }, [inView, i, onPass]);

  return (
    <motion.li
      ref={ref}
      className={`fit-row${on ? " is-on" : ""}`}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      <span className="fit-idx" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>

      <span className="fit-check" aria-hidden="true">
        <motion.span
          className="fit-check-box"
          initial={reduce ? false : { scale: 0.6 }}
          animate={{ scale: on ? 1 : 0.6 }}
          transition={{ type: "spring", stiffness: 520, damping: 18, delay: reduce ? 0 : 0.12 }}
        />
        <svg viewBox="0 0 24 24" width="24" height="24">
          <motion.path
            d="M6.5 12.5 L10.5 16.5 L18 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: on ? 1 : 0 }}
            transition={{ duration: 0.42, delay: reduce ? 0 : 0.26, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
      </span>

      <h3 className="fit-ask">{item.ask}</h3>

      <span className="fit-wire" aria-hidden="true">
        <span className="fit-wire-line" />
        <span className="fit-wire-dot" />
      </span>

      <p className="fit-proof">{item.proof}</p>

      <a className="fit-link" href={`#${item.ref}`}>
        <span aria-hidden="true">→</span> see case
        <span className="fit-sr"> for “{item.ask}”</span>
      </a>
    </motion.li>
  );
}

export default function Fit({ fit = [] }) {
  const reduce = useReducedMotion();
  const [passed, setPassed] = useState(() => new Set());
  const onPass = useCallback(
    (i) => setPassed((p) => (p.has(i) ? p : new Set(p).add(i))),
    []
  );
  const total = fit.length;
  const count = reduce ? total : passed.size;
  const done = total > 0 && count === total;

  return (
    <section id="fit" className="section fit" aria-labelledby="fit-title">
      <div className="container">
        <div className="fit-head">
          <p className="eyebrow">For Ather's design team</p>
          <h2 id="fit-title" className="h2">
            Designing <em>for the designers</em>
          </h2>
          <p className="lede">
            The role isn't about designing vehicles. It's about spotting the friction in how industrial,
            vehicle, UI/UX and CMF designers work, and quietly removing it. Here is each thing the job asks
            for, checked against where the evidence lives on this page.
          </p>
        </div>

        <div className={`fit-panel${done ? " is-done" : ""}`}>
          <div className="fit-bar">
            <span className="fit-bar-title">
              <span className="fit-bar-hash" aria-hidden="true">#</span> Requirements → evidence
            </span>
            <span className="fit-status" aria-hidden="true">
              <span className="fit-status-dot" />
              <span className="fit-status-count">{count}/{total}</span> checks passed
            </span>
          </div>
          <div className="fit-progress" aria-hidden="true">
            <motion.span
              className="fit-progress-fill"
              initial={false}
              animate={{ scaleX: total ? count / total : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
            />
          </div>

          <div className="fit-cols" aria-hidden="true">
            <span />
            <span />
            <span>Ask · from the JD</span>
            <span />
            <span>Evidence · on this page</span>
            <span />
          </div>

          <ol className="fit-list">
            {fit.map((item, i) => (
              <CheckRow key={item.ask} item={item} i={i} reduce={reduce} onPass={onPass} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
