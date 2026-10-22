import { useState } from "react";
import "./Craft.css";

function IconImage() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.5" cy="6.2" r="1.2" fill="currentColor" />
      <path d="M2.5 12l3.6-3.6 2.4 2.4 2-2 3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IconComponent() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 1.8l2.4 2.4L8 6.6 5.6 4.2zM11.8 5.6L14.2 8l-2.4 2.4L9.4 8zM4.2 5.6L6.6 8l-2.4 2.4L1.8 8zM8 9.4l2.4 2.4L8 14.2l-2.4-2.4z" fill="currentColor" />
    </svg>
  );
}

function fileName(item) {
  if (item.img) return item.img.split("/").pop();
  return `${item.title.split(",")[0].trim().toLowerCase().replace(/\s+/g, "-")}.link`;
}

function Marquee({ row, index }) {
  const items = row.items || [];
  const reps = Math.max(1, Math.ceil(12 / Math.max(1, items.length)));
  const filled = Array.from({ length: reps }, (_, r) => items.map((t) => ({ t, dup: r > 0 }))).flat();
  const dur = Math.max(26, filled.length * 3.2);
  const group = (hidden) => (
    <ul className="marquee__group" aria-hidden={hidden || undefined} role="list">
      {filled.map(({ t, dup }, k) => (
        <li key={k} className={`chip marquee__chip${dup ? " is-dup" : ""}`} aria-hidden={!hidden && dup ? true : undefined}>
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="tool-row">
      <h4 className="tool-row__k">
        <span className="tool-row__idx" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        {row.k}
      </h4>
      <div className="marquee">
        <div className={`marquee__track${index % 2 ? " is-rev" : ""}`} style={{ "--dur": `${dur}s` }}>
          {group(false)}
          {group(true)}
        </div>
      </div>
    </div>
  );
}

export default function Craft({ design = [], tools = [] }) {
  const [active, setActive] = useState(0);
  const [dims, setDims] = useState({});
  const item = design[active] || {};
  const size = dims[active];

  return (
    <section id="craft" className="section craft">
      <div className="container">
        <p className="eyebrow">Design &amp; visual work</p>
        <h2 className="h2">
          Where design was <em>the deliverable</em>
        </h2>

        <div className="craft-grid">
          {/* Layers panel */}
          <div className="craft-layers">
            <div className="craft-layers__head">
              <span>Layers</span>
              <span className="craft-layers__count">{design.length}</span>
            </div>
            <div className="craft-layers__parent" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
              <span className="craft-layers__hash">#</span> design-work
            </div>
            <ul className="craft-layers__list" role="list">
              {design.map((d, i) => (
                <li
                  key={d.title}
                  className={`layer${i === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                >
                  <button
                    type="button"
                    className="layer__btn"
                    aria-pressed={i === active}
                    aria-controls="craft-preview"
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                  >
                    <span className="layer__icon">{d.img ? <IconImage /> : <IconComponent />}</span>
                    <span className="layer__title">{d.title}</span>
                    <span className={`layer__side${d.side === "Live" ? " is-live" : ""}`}>{d.side}</span>
                  </button>
                  {d.href && (
                    <a
                      className="layer__link"
                      href={d.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${d.title} (new tab)`}
                    >
                      ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Preview frame */}
          <div className="craft-preview" id="craft-preview">
            <p className="frame-label craft-preview__label">
              <span>{fileName(item)}</span>
            </p>
            <div className="craft-preview__frame selected">
              <span className="handles" aria-hidden="true"><i /><i /><i /><i /></span>
              <div className="craft-preview__media">
                {design.map((d, i) =>
                  d.img ? (
                    <img
                      key={d.title}
                      src={d.img}
                      alt={i === active ? d.title : ""}
                      aria-hidden={i === active ? undefined : true}
                      loading="lazy"
                      decoding="async"
                      width="1200"
                      height="750"
                      className={`craft-preview__img${i === active ? " is-on" : ""}${d.img.startsWith("shots/") ? " is-shot" : ""}`}
                      onLoad={(e) => {
                        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                        setDims((s) => (s[i] ? s : { ...s, [i]: `${w} × ${h}` }));
                      }}
                    />
                  ) : (
                    <div
                      key={d.title}
                      className={`craft-preview__ph${i === active ? " is-on" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="ph__grid" />
                      <span className="ph__word">{d.title.split(",")[0]}</span>
                      <span className="ph__meta">no preview · {d.side}{d.href ? " · open link ↗" : ""}</span>
                    </div>
                  )
                )}
              </div>
              <span className="craft-preview__size" aria-hidden="true">{item.img ? size || "…" : "Hug × Hug"}</span>
            </div>

            <div className="craft-preview__meta" aria-live="polite">
              <div className="craft-preview__row">
                <h3 className="craft-preview__title">{item.title}</h3>
                <span className={`craft-preview__side${item.side === "Live" ? " is-live" : ""}`}>{item.side}</span>
              </div>
              <p className="craft-preview__sub">{item.sub}</p>
              {item.href && (
                <a className="craft-preview__link" href={item.href} target="_blank" rel="noreferrer">
                  Open <span aria-hidden="true">↗</span>
                  <span className="sr-only"> {item.title} (new tab)</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Toolbox */}
        <div className="toolbox">
          <h3 className="frame-label toolbox__label">Toolbox</h3>
          <div className="toolbox__rows">
            {tools.map((row, r) => (
              <Marquee key={row.k} row={row} index={r} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
