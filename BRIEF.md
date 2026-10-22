# Build brief (shared by every agent)

Project: `C:\Users\sktam\portfolio` — a Vite + React 18 portfolio for Tamil Adhavan S K, applying for an
"AI Generalist, Design" internship on Ather Energy's Industrial Design team. The JD: "This role is not about
designing vehicles — it's about designing for the designers": find friction in designers' workflows (Industrial
Design, Vehicle Design, UI/UX, CMF), test emerging AI tools, build and deploy simple tools, document them, present.

## Concept: the site IS a design-tool canvas
Near-black board with a dot grid (already rendered by `.board` in App). Things on the page behave like objects in a
Figma / node-editor canvas: frame labels (`# Frame name`), blue selection outlines with white corner handles,
collaborator cursors with name tags, draggable objects, node graphs with animated wires, sticky notes,
inspector-style property panels, measurement guides (red/pink dimension lines with px labels), a toolbar.
One electric green accent (`--accent`) means "live / selected / shipped". Blue `--select` for selection.
Mix: Geist (UI), Instrument Serif italic for emphasis words (class `serif` or `<em>` in `.h2`), Geist Mono for labels.
Goal: a design-team reviewer should think "this person has real taste and builds delightful interactive tools".
Bold and memorable, but readable, fast and polished — never cluttered, never gimmicky at the expense of content.
Quality bar: Linear / Vercel / Rauno / Emil Kowalski–level craft. Springy, interruptible motion; feedback on press.

## Rules
- Tokens and shared primitives are in `src/styles.css` (read it first): `.container`, `.section`, `.eyebrow`,
  `.h2`, `.lede`, `.chip`, `.chips`, `.btn`, `.btn.primary`, `.frame`, `.frame-label`, `.selected`, `.handles`.
  Use the CSS variables; do not hardcode new palettes (sticky-note colours in data are fine).
- Content comes ONLY from `src/data.js` (read it). Do not invent facts, numbers, employers or awards. You may
  write short UI microcopy (labels like "drag me", "# Case 01"), nothing that claims new facts.
- Only `framer-motion` 11 and React are installed. Do NOT add npm dependencies. Plain CSS (one CSS file per
  component, imported from the component), no Tailwind.
- ONLY create/edit the files assigned to you. Never edit App.jsx, data.js, styles.css, index.html or another
  agent's files. If you need a shared change, say so in your final report.
- Images live in `public/` and are referenced with relative paths exactly as in data.js (e.g. `img/nokia-0.jpg`).
  `loading="lazy"` on below-the-fold images; give width/height or aspect-ratio to avoid layout shift.
- Mobile matters (375px wide): no horizontal page scroll, 16px gutters, drag interactions must not trap page
  scrolling on touch (use `touch-action` sensibly, or disable drag under 640px). Respect
  `prefers-reduced-motion` (framer-motion `useReducedMotion`).
- Accessibility: real headings (one h2 per section, h3 per item), alt text, buttons are `<button>`, links `<a>`,
  visible focus, decorative elements `aria-hidden`.
- Each section's root is `<section id="..." className="section">` with a `.container` inside (Hero may differ).
- Verify: build to your OWN outDir so agents don't collide:
  `cd C:/Users/sktam/portfolio && npx vite build --outDir C:/Users/sktam/AppData/Local/Temp/pf-<YOURNAME> --emptyOutDir`
  It must build with zero errors. If you want to look at it, serve with
  `npx vite preview --outDir C:/Users/sktam/AppData/Local/Temp/pf-<YOURNAME> --port <YOURPORT> --host 127.0.0.1`
  (run it in the background) and screenshot with headless Chrome:
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,2400 --virtual-time-budget=8000 --screenshot="C:\\Users\\sktam\\AppData\\Local\\Temp\\pf-<YOURNAME>.png" http://127.0.0.1:<YOURPORT>/`
  then Read the PNG to check your section (other agents' sections may be empty stubs; that's fine).
  Also check a 390px-wide screenshot. Kill your preview server when done.
- Finish in about 15 minutes. Final report: files you wrote, what the components do, anything the integrator must know.
