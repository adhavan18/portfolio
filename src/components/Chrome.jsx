import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import "./Chrome.css";

/* ---------- icons (design-tool style, 18px, stroke) ---------- */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
const Icon = {
  top: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path {...P} d="M4.5 3.5 15 8.2l-4.6 1.5-1.6 4.8L4.5 3.5Z" /></svg>
  ),
  work: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path {...P} d="M7 2.5v15M13 2.5v15M2.5 7h15M2.5 13h15" /></svg>
  ),
  process: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle {...P} cx="4.5" cy="5" r="2" /><circle {...P} cx="15.5" cy="15" r="2" /><path {...P} d="M6.5 5h3a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 0 14.5 15h-1" /></svg>
  ),
  ideas: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path {...P} d="M3.5 3.5h13v8.5l-4.5 4.5H3.5v-13Z" /><path {...P} d="M16.5 12H12v4.5" /></svg>
  ),
  wins: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path {...P} d="M6 3.5h8v4a4 4 0 0 1-8 0v-4ZM6 5H3.5v1.2A2.8 2.8 0 0 0 6.3 9M14 5h2.5v1.2A2.8 2.8 0 0 1 13.7 9M10 11.5v3M7 16.5h6" /></svg>
  ),
  contact: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path {...P} d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-9Z" /><path {...P} d="m3.5 5 6.5 5 6.5-5" /></svg>
  ),
  search: (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle {...P} cx="9" cy="9" r="5.5" /><path {...P} d="m13 13 4 4" /></svg>
  ),
  case: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect {...P} x="3" y="4" width="14" height="12" rx="2" /><path {...P} d="M3 8h14" /></svg>
  ),
  copy: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect {...P} x="7" y="7" width="10" height="10" rx="2" /><path {...P} d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
  ),
  out: (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path {...P} d="M8 4H5a1.5 1.5 0 0 0-1.5 1.5v9.5A1.5 1.5 0 0 0 5 16.5h9.5A1.5 1.5 0 0 0 16 15v-3M11 3.5h5.5V9M16.5 3.5 9 11" /></svg>
  ),
};

const SECTIONS = [
  { id: "top", label: "Top", observe: "top-hero" },
  { id: "work", label: "Work" },
  { id: "process", label: "Process" },
  { id: "ideas", label: "Ideas" },
  { id: "wins", label: "Wins" },
  { id: "contact", label: "Contact" },
];

/* ---------- utilities ---------- */

function isMacLike() {
  if (typeof navigator === "undefined") return false;
  const p = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(p);
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

function scrollToId(id, reduce) {
  const behavior = reduce ? "auto" : "smooth";
  if (id === "top") {
    window.scrollTo({ top: 0, behavior });
    history.replaceState(null, "", "#top");
    return true;
  }
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  history.replaceState(null, "", `#${id}`);
  return true;
}

// subsequence match: consecutive hits and word starts score higher. Returns null when it doesn't match.
function fuzzy(query, text) {
  const q = query.trim().toLowerCase();
  if (!q) return { score: 0, hits: [] };
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct >= 0) {
    return { score: 1000 - direct + (direct === 0 || /\W/.test(t[direct - 1]) ? 200 : 0), hits: Array.from({ length: q.length }, (_, i) => direct + i) };
  }
  let ti = 0;
  let score = 0;
  let prev = -2;
  const hits = [];
  for (const ch of q) {
    if (ch === " ") continue;
    const at = t.indexOf(ch, ti);
    if (at < 0) return null;
    score += at === prev + 1 ? 12 : 1;
    if (at === 0 || /\W/.test(t[at - 1])) score += 8;
    hits.push(at);
    prev = at;
    ti = at + 1;
  }
  return { score, hits };
}

function Highlight({ text, hits }) {
  if (!hits || !hits.length) return text;
  const set = new Set(hits);
  return Array.from(text).map((c, i) => (set.has(i) ? <mark key={i}>{c}</mark> : <span key={i}>{c}</span>));
}

/* ---------- command palette ---------- */

function Palette({ open, onClose, actions, reduce }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const restore = useRef(null);

  const results = useMemo(() => {
    const scored = [];
    actions.forEach((a, order) => {
      const m = fuzzy(q, `${a.label} ${a.keywords || ""}`);
      if (m) scored.push({ ...a, score: m.score, hits: m.hits.filter((h) => h < a.label.length), order });
    });
    if (q.trim()) scored.sort((a, b) => b.score - a.score || a.order - b.order);
    return scored;
  }, [q, actions]);

  useEffect(() => {
    if (open) {
      restore.current = document.activeElement;
      setQ("");
      setIdx(0);
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
      return () => {
        document.documentElement.style.overflow = prev;
        const el = restore.current;
        if (el && typeof el.focus === "function" && document.contains(el)) el.focus({ preventScroll: true });
      };
    }
  }, [open]);

  useEffect(() => setIdx(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  const run = (a) => {
    if (!a) return;
    onClose();
    // let the dialog close (and restore scrolling) before acting
    requestAnimationFrame(() => a.run());
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIdx(Math.max(0, results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[idx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab") {
      // the input is the only tab stop; options are reached with the arrow keys
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  let lastGroup = null;
  const activeId = results[idx] ? `cmd-opt-${results[idx].key}` : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmd-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="cmd"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -6 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34, mass: 0.8 }}
          >
            <div className="cmd-search">
              {Icon.search}
              <input
                ref={inputRef}
                className="cmd-input"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to a section, a case, or copy my email…"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label="Search commands"
                autoComplete="off"
                spellCheck="false"
              />
              <kbd className="cmd-esc">esc</kbd>
            </div>
            <ul className="cmd-list" id="cmd-list" role="listbox" aria-label="Commands" ref={listRef}>
              {results.length === 0 && (
                <li className="cmd-empty" role="presentation">
                  Nothing matches “{q}”.
                </li>
              )}
              {results.map((a, i) => {
                const header = !q.trim() && a.group !== lastGroup ? a.group : null;
                lastGroup = a.group;
                return (
                  <li key={a.key} role="presentation">
                    {header && (
                      <div className="cmd-group mono" aria-hidden="true">
                        {header}
                      </div>
                    )}
                    <div
                      id={`cmd-opt-${a.key}`}
                      data-idx={i}
                      role="option"
                      aria-selected={i === idx}
                      className={`cmd-item${i === idx ? " is-active" : ""}`}
                      onMouseMove={() => i !== idx && setIdx(i)}
                      onClick={() => run(a)}
                    >
                      {i === idx && (
                        <motion.span
                          className="cmd-hl"
                          layoutId="cmd-hl"
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 700, damping: 45 }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="cmd-ico" aria-hidden="true">
                        {a.icon}
                      </span>
                      <span className="cmd-label">
                        <Highlight text={a.label} hits={a.hits} />
                      </span>
                      <span className="cmd-hint mono" aria-hidden="true">
                        {a.hint}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cmd-foot mono" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Chrome: progress bar, file tab, toolbar, palette ---------- */

export default function Chrome({ person = {}, cases = [] }) {
  const reduce = useReducedMotion();
  const [mac, setMac] = useState(false);
  const [active, setActive] = useState("top");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(0);

  useEffect(() => setMac(isMacLike()), []);
  const keyLabel = mac ? "⌘K" : "Ctrl K";

  /* scroll progress */
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 34, restDelta: 0.001 });

  /* active section */
  useEffect(() => {
    const map = new Map();
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.observe || s.id) || (s.id === "top" ? document.getElementById("top") : null);
      if (el) map.set(el, s.id);
    });
    if (!map.size) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(map.get(e.target));
        });
      },
      // a thin band just above the middle of the viewport decides which section is "selected"
      { rootMargin: "-42% 0px -56% 0px", threshold: 0 }
    );
    map.forEach((_, el) => io.observe(el));

    // short last section: when the page bottoms out, contact is the current one
    const onScroll = () => {
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4 && document.getElementById("contact")) setActive("contact");
      else if (window.scrollY < 80) setActive("top");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* global shortcut */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const actions = useMemo(() => {
    const list = SECTIONS.map((s) => ({
      key: `go-${s.id}`,
      group: "Navigate",
      label: s.id === "top" ? "Go to top" : `Go to ${s.label}`,
      keywords: s.id === "wins" ? "awards recognition prizes hackathons" : s.id === "process" ? "steps flow how" : s.id === "contact" ? "email hire reach" : "",
      hint: `#${s.id}`,
      icon: Icon[s.id],
      run: () => scrollToId(s.id, reduce),
    }));
    cases.forEach((c) => {
      list.push({
        key: `case-${c.id}`,
        group: "Case studies",
        label: c.title,
        keywords: `case ${c.tag || ""}`,
        hint: "case",
        icon: Icon.case,
        run: () => scrollToId(c.id, reduce) || scrollToId(`case-${c.id}`, reduce) || scrollToId("work", reduce),
      });
    });
    if (person.email) {
      list.push({
        key: "copy-email",
        group: "Contact",
        label: "Copy email address",
        keywords: person.email,
        hint: "copy",
        icon: Icon.copy,
        run: async () => {
          const ok = await copyText(person.email);
          if (ok) flash("Email copied ✓");
          else window.location.href = `mailto:${person.email}`;
        },
      });
    }
    if (person.linkedin) {
      list.push({ key: "linkedin", group: "Contact", label: "Open LinkedIn", keywords: "profile", hint: "↗", icon: Icon.out, run: () => window.open(person.linkedin, "_blank", "noopener,noreferrer") });
    }
    if (person.github) {
      list.push({ key: "github", group: "Contact", label: "Open GitHub", keywords: "code repos", hint: "↗", icon: Icon.out, run: () => window.open(person.github, "_blank", "noopener,noreferrer") });
    }
    return list;
  }, [cases, person.email, person.linkedin, person.github, reduce, flash]);

  const close = useCallback(() => setOpen(false), []);

  const onDockClick = (e, id) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (scrollToId(id, reduce)) {
      e.preventDefault();
      setActive(id);
    }
  };

  const dockSpring = reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 };

  return (
    <>
      <motion.div className="chrome-progress" style={{ scaleX: reduce ? scrollYProgress : smooth }} aria-hidden="true" />

      <div className="filetab" aria-hidden="true">
        <span className="filetab-logo">
          <svg viewBox="0 0 16 16" width="12" height="12"><path d="M5 1h3v5H5a2.5 2.5 0 0 1 0-5Zm3 0h3a2.5 2.5 0 0 1 0 5H8V1Zm0 5h3a2.5 2.5 0 1 1-3 2.5V6ZM5 6h3v5H5a2.5 2.5 0 0 1 0-5Zm0 5h3v2.5A2.5 2.5 0 1 1 5 11Z" fill="currentColor" /></svg>
        </span>
        <span className="filetab-name">tamil-adhavan.fig</span>
        <span className="filetab-live">
          <i />
          live
        </span>
      </div>

      <button type="button" className="kbd-hint" onClick={() => setOpen(true)} aria-label="Open command palette" aria-keyshortcuts="Control+K Meta+K">
        <kbd>{mac ? "⌘" : "Ctrl"}</kbd>
        <kbd>K</kbd>
      </button>

      <motion.nav
        className="dock"
        aria-label="Sections"
        initial={reduce ? false : { y: 90, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26, delay: 0.6 }}
      >
        <ul className="dock-list">
          {SECTIONS.map((s) => {
            const on = active === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`dock-btn${on ? " is-on" : ""}`}
                  aria-current={on ? "location" : undefined}
                  onClick={(e) => onDockClick(e, s.id)}
                  title={s.label}
                >
                  {on && <motion.span className="dock-hl" layoutId="dock-hl" transition={dockSpring} aria-hidden="true" />}
                  <span className="dock-ico">{Icon[s.id]}</span>
                  <span className="dock-label">{s.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <span className="dock-sep" aria-hidden="true" />
        <button type="button" className="dock-btn dock-k" onClick={() => setOpen(true)} aria-label="Open command palette" aria-keyshortcuts="Control+K Meta+K" aria-haspopup="dialog">
          <span className="dock-ico dock-k-search">{Icon.search}</span>
          <span className="dock-k-text mono">{keyLabel}</span>
        </button>
      </motion.nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="chrome-toast mono"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96, x: "-50%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }}
            aria-hidden="true"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <span className="chrome-sr" role="status" aria-live="polite">
        {toast ? toast.replace(" ✓", "") : ""}
      </span>

      <Palette open={open} onClose={close} actions={actions} reduce={reduce} />
    </>
  );
}
