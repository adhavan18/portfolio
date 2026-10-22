// Every fact on the site lives here. Numbers come from the resume, the project repos,
// and the cheques and certificates in the LinkedIn posts.

export const person = {
  name: "Tamil Adhavan S K",
  short: "Tamil Adhavan",
  role: "AI Generalist · Design",
  line: "I find the friction in how people work and build simple AI tools that remove it.",
  sub: "I talk to the people doing the work, test the AI tools that might help, ship the smallest thing that works, and write it down so others can use it without me.",
  now: "Founding engineer, BillianceAI",
  edu: "B.Tech CSE, SRM IST · CGPA 8.26 · 2027",
  before: "Nokia · CICT (Ministry of Education)",
  city: "Chennai, India",
  email: "sk.tamiladhavan@gmail.com",
  linkedin: "https://www.linkedin.com/in/tamiladhavan/",
  github: "https://github.com/adhavan18",
  photo: "me.jpg",
};

export const stats = [
  { value: 8, label: "First places" },
  { value: 18, label: "Podiums and awards" },
  { value: 1.1, decimals: 1, prefix: "₹", unit: "lakh", label: "Prize money won" },
  { value: 30, unit: "PRs", label: "Merged into open source" },
];

// Who the collaborator cursors on the canvas are named after: the designers this role serves
export const cursors = ["Industrial Design", "Vehicle Design", "UI/UX", "CMF", "Engineering"];

// The JD's asks, mapped to where the evidence is
export const fit = [
  { ask: "Find the friction by talking to people", proof: "Store visits with retail owners shaped BillianceAI. Time on the shopfloor with line engineers shaped the Nokia inspection tool.", ref: "billiance" },
  { ask: "Test emerging AI tools properly", proof: "Qwen2.5-VL vs LLaVA vs YOLOv8 before building. Three LLMs, two voice and two speech engines swappable inside KLIP.", ref: "klip" },
  { ask: "Build simple, frictionless tools", proof: "vakeel turns a 100-page filing into one plain answer. PolyDeck turns speech into a slide deck.", ref: "vakeel" },
  { ask: "Fit into the existing workflow", proof: "PR Radar comments on pull requests where maintainers already work, and plugs into Claude through MCP.", ref: "prradar" },
  { ask: "Deploy so people actually use it", proof: "Live on AWS, Render, Vercel and the Play Store. Every project here has a link that works today.", ref: "work" },
  { ask: "Document and present", proof: "Onboarding guides for non-technical store staff, a VR walkthrough for Nokia stakeholders, 18 stage pitches to juries.", ref: "nokia" },
];

// The process, drawn as a node graph
export const steps = [
  { id: "observe", title: "Observe", text: "Sit with the person and watch the task, not the slide about the task.", io: "designer's day → notes" },
  { id: "problem", title: "Find the real problem", text: "The complaint is a symptom. Find the repeated step behind it.", io: "notes → one friction" },
  { id: "test", title: "Test the tools", text: "Try two or three AI options on real inputs before picking one.", io: "friction → best tool" },
  { id: "ship", title: "Ship small", text: "The simplest version that saves time on day one, deployed with a link.", io: "tool → live link" },
  { id: "doc", title: "Document & measure", text: "A one-page guide, then check whether people still use it in week two.", io: "link → adoption" },
];

export const cases = [
  {
    id: "billiance",
    title: "BillianceAI",
    tag: "Founding engineer · 2024 to now",
    one: "Store owners were losing stock they couldn't explain, and nobody had time to watch CCTV. I built a tool that watches for them and sends a clip to the person who can act on it.",
    hero: { src: "img/innovatorsday-1.jpg", alt: "Team BillianceAI receiving first place at Innovators' Day 2025", cap: "First of 700+ teams from 50+ colleges at Innovators' Day 2025, presenting BillianceAI." },
    gallery: [{ src: "shots/billiance-site.jpg", alt: "BillianceAI product site" }],
    rows: [
      { k: "Friction", v: "A 15,000 sq ft store had an ₹89,970 stock gap and no way to tell where it went. Staff couldn't watch screens all day, and false alarms made them stop trusting alerts." },
      { k: "Tools tested", chips: ["Qwen2.5-VL-7B", "LLaVA-1.5-7B", "YOLOv8", "ByteTrack"], v: "Each one tested on the store's own footage, against the workflow it had to fit." },
      { k: "Built", list: ["Real-time detection with an instant alert carrying a replayable clip, so staff check before acting", "A dashboard non-technical staff use every day, plus payments and alerting integrations", "Plain-language onboarding docs so stores run it without calling me"] },
      { k: "Listened", v: "Staff said too many alerts were wrong. I added a verification step and false positives fell 30%." },
    ],
    results: [
      { value: "32,567", label: "Customers in a 1-month pilot" },
      { value: "28", label: "Confirmed thefts caught" },
      { value: "−30%", label: "False positives" },
      { value: "11", label: "Podiums and awards" },
    ],
    links: [
      { label: "Product site", href: "https://billianceai.lovable.app/" },
      { label: "Code", href: "https://github.com/adhavan18/billianceai-razorpay" },
    ],
  },
  {
    id: "vakeel",
    title: "vakeel · वकील",
    tag: "Environmental Hacks 2026 · solo",
    one: "Environmental clearance filings run to hundreds of pages, and the people living next to a coal plant can't read them in time to object. vakeel reads the filing for them and links every claim to its page.",
    hero: { src: "shots/vakeel-live.jpg", alt: "vakeel home page" },
    gallery: [
      { src: "shots/vakeel-05-evidence-drawer.jpg", alt: "Evidence drawer showing the quote on the source PDF page" },
      { src: "shots/vakeel-06-refused.jpg", alt: "Claims the verifier rejected, shown openly" },
    ],
    galleryCap: "Left: tap a ✓ to see the quote on the real PDF page. Right: claims the verifier rejected are shown, not hidden.",
    rows: [
      { k: "Friction", v: "Page 18 of one set of committee minutes lets a 1,320 MW coal expansion skip its public hearing. Nobody affected would find that line in time." },
      { k: "Design call", v: "Trust beats fluency. Every number needs a word-for-word quote and a page, and code checks it against the PDF. Answers come in English, Hindi and the state's language, and the app never shows a number that failed the check." },
      { k: "Stack", chips: ["Amazon Bedrock · Nova 2 Lite", "Step Functions", "CloudFront", "PDF verification"] },
    ],
    results: [
      { value: "52 s", label: "To find both buried lines" },
      { value: "732", label: "Pages read" },
      { value: "65", label: "AI claims rejected" },
      { value: "3", label: "Languages" },
    ],
    links: [
      { label: "Live app", href: "https://d4i9n8m04ddaa.cloudfront.net" },
      { label: "3-min demo", href: "https://www.youtube.com/watch?v=IDNKushA0cg" },
      { label: "Code & docs", href: "https://github.com/adhavan18/vakeel" },
    ],
  },
  {
    id: "klip",
    title: "KLIP",
    tag: "Interaction & character design · Electron",
    one: "A voice-driven AI companion that lives in the corner of your screen. Hold a key, ask about anything on screen, and a small glowing character glides over to point at the answer.",
    hero: { src: "shots/klip.gif", alt: "KLIP companion pointing at things on screen" },
    rows: [
      { k: "Design", v: "A character with no mouth and two capsule eyes that blink, look around and react. Six states (idle, listening, thinking, speaking, success, error) run on a state machine animated with Framer Motion, so the assistant feels alive without a chat window." },
      { k: "Tools tested", chips: ["Claude", "GPT-5", "Gemini 2.5", "ElevenLabs", "Sarvam Bulbul", "Groq Whisper", "Sarvam Saarika"], v: "All swappable live, so the best engine for each language or task can be compared side by side." },
      { k: "Shipped", v: "Windows, macOS and Linux installers built by CI, a custom push-to-talk shortcut, local-only chat history and encrypted key storage. The idea credits Farza's macOS app Clicky; KLIP is a from-scratch, cross-platform build." },
    ],
  },
  {
    id: "polydeck",
    title: "PolyDeck",
    tag: "Sarvam Epoch Buildathon · concept → visual",
    one: "Talk through an idea and watch it become a presentation. Speak in Tamil, get the deck in English. It closes the gap between thinking out loud and having something to show.",
    mock: {
      said: "நம்ம கடையில திருட்டு அதிகமா இருக்கு, CCTV பார்க்க ஆள் இல்ல…",
      slideTitle: "Retail theft goes unseen",
      bullets: ["Losses with no explanation", "No staff free to watch CCTV", "Need: alerts with proof"],
    },
    rows: [
      { k: "Built", v: "Mic → Sarvam speech-to-text → an LLM that writes strict-JSON slides → live deck → one-click .pptx export. A mock mode keeps the demo working without Wi-Fi." },
      { k: "Stack", chips: ["React", "Tailwind", "Framer Motion", "Sarvam Saaras v3", "sarvam-30b", "PptxGenJS"] },
    ],
  },
  {
    id: "prradar",
    title: "PR Radar",
    tag: "Workflow integration · FalkorDB",
    one: "Maintainers keep asking \"who knows this file?\" and \"is this a duplicate?\" PR Radar answers from a graph of who wrote, reviewed and touched what, and shows the path behind every answer.",
    hero: { src: "shots/prradar-live.jpg", alt: "PR Radar live graph of a repository" },
    gallery: [{ src: "shots/prradar-hero_answer.jpg", alt: "PR Radar answering a question with a traced evidence path" }],
    rows: [
      { k: "Integration", v: "It meets people where they already work. A GitHub Action comments on every new PR with what the graph found, and an MCP server exposes the same tools inside Claude." },
      { k: "Insight", v: "\"What if this maintainer leaves?\" 625 of 780 files they touched would have no other human reviewer. Each file comes with its proof path." },
    ],
    results: [
      { value: "625/780", label: "Files with a single owner" },
      { value: "8.6 ms", label: "Graph query time" },
    ],
    links: [
      { label: "Live demo", href: "https://pr-radar.onrender.com" },
      { label: "Code & eval", href: "https://github.com/adhavan18/pr-radar" },
    ],
  },
  {
    id: "nokia",
    title: "AI visual inspection at Nokia",
    tag: "Software engineering intern · Dec 2024 to Jan 2025",
    one: "Manual PCB inspection was the bottleneck on the assembly line. I talked to the line engineers, built a vision-language inspection tool, and integrated it into live production.",
    hero: { src: "img/nokia-0.jpg", alt: "At Nokia Solutions and Networks, Sriperumbudur", crop: "50% 30%" },
    rows: [
      { k: "Built", v: "A fine-tuned vision-language model for defect detection on real, messy shopfloor images (~77% accuracy), with augmentation, threshold tuning and failure analysis. A C++ simulation tested changes before rollout." },
      { k: "Validated", v: "Before touching the physical line, I built a VR prototype of the proposed workflow so engineers and stakeholders could walk through it and push back first." },
    ],
    results: [{ value: "~77%", label: "Detection on live shopfloor images" }],
  },
];

export const design = [
  { title: "Creators Clash, 1st place: UI/UX design hackathon", sub: "Cryptrix 2024, St. Joseph's. 30-minute rounds: an ideathon, then a user-centered interface designed end to end in Figma.", side: "Sep 2024", img: "img/creatorsclash-2.jpg" },
  { title: "CICT Digital Archives", sub: "12 Classical Tamil research tools (lexicons, concordances, an audio lexicon) in one calm, searchable interface for scholars, plus 2 apps on the Play Store.", side: "Live", href: "https://cictdigitalarchives.vercel.app", img: "shots/cict.jpg" },
  { title: "IEEE TEMS SRM portal", sub: "Chapter website with events, projects, team and a Gemini chat assistant, with motion built in Framer Motion.", side: "Live", href: "https://ieeetems.vercel.app", img: "shots/ieeetems.jpg" },
  { title: "GPU Poster Fest 2.0, 1st place", sub: "A poster that explains a GPU-core scheduling framework to a mixed jury. Technical depth, made readable.", side: "Nov 2025", img: "img/gpu-2.jpg" },
  { title: "copperhead, an AI agent for PCB design", sub: "Contributor to an open-source \"Cursor for circuit boards\" that turns a plain-language brief into a KiCad design. AI for CAD-style tools is where I want to go.", side: "Merged", href: "https://github.com/copperheadhq/copperhead/pull/124" },
];

export const ideas = [
  { who: "Industrial · Vehicle design", title: "Sketch → render variations in minutes", text: "Early concepts need many directions before one is worth a full render. Feed a line sketch to a guided image model and get 10 variants that keep the proportions.", how: "Test: ControlNet / ComfyUI vs Vizcom on the team's own sketches", color: "#d9f99d" },
  { who: "CMF", title: "Colour & finish previews on real geometry", text: "Trying a new colour or finish means a full re-render. A small tool that swaps CMF on a fixed render pass, using the team's swatch library, could cut that wait.", how: "Test: render passes + material masks vs image-to-image recolour", color: "#fde68a" },
  { who: "Whole team", title: "Search the archive by image", text: "\"We did something like this in 2021\" usually means digging through folders. Embed every past render and sketch so a designer can search by dropping in a picture.", how: "Test: CLIP / SigLIP embeddings over a sample folder, measure search time", color: "#bae6fd" },
  { who: "UI/UX · Reviews", title: "Design review → action list", text: "Feedback said in a review gets lost. Record the review and turn it into tasks pinned to the frames it was about, in the tool the team already uses.", how: "Pieces already built: speech → structure (PolyDeck, KLIP)", color: "#fbcfe8" },
];

export const tools = [
  { k: "AI models", items: ["Claude", "GPT-5", "Gemini", "Amazon Bedrock", "Qwen2.5-VL", "LLaVA", "YOLOv8", "RF-DETR", "Sarvam", "ElevenLabs", "Whisper"] },
  { k: "AI methods", items: ["Fine-tuning (SFT / LoRA)", "Agents (LangGraph)", "MCP", "RAG", "Prompt design", "Evaluation"] },
  { k: "Build & ship", items: ["Python", "JavaScript / TypeScript", "React", "Electron", "FastAPI", "Docker", "AWS", "Vercel", "GitHub Actions"] },
  { k: "Design", items: ["Figma", "UI/UX", "Framer Motion", "CAD (coursework)", "VR prototyping", "Canva"] },
];

export const winPhotos = [
  { src: "img/technova-0.jpg", cap: "Technova · 1st" },
  { src: "img/xploreai-3.jpg", cap: "XPLORE.AI · 1st" },
  { src: "img/creatorsclash-2.jpg", cap: "Creators Clash · 1st (UI/UX)" },
  { src: "img/gpu-2.jpg", cap: "GPU Poster Fest · 1st" },
  { src: "img/hackndroid-0.jpg", cap: "HackNDroid · 3rd of 122" },
  { src: "img/sparktank-0.jpg", cap: "SparkTank 3.0 · 3rd" },
  { src: "img/hackforge-1.jpg", cap: "Hackforge · 2nd of 60" },
  { src: "img/nexathon-0.jpg", cap: "Nexathon · Best pitch" },
  { src: "img/projectexpo-0.jpg", cap: "Project Expo · 3rd" },
  { src: "img/innovatorsday-1.jpg", cap: "Innovators' Day · 1st of 700+" },
];

export const wins = [
  { title: "Innovators' Day 2025, 1st of 700+ teams", sub: "Sri Manakula Vinayagar Engineering College, Puducherry · BillianceAI", side: "Sep 2025", prize: "₹15,000" },
  { title: "XPLORE.AI, 1st place", sub: "KCG College of Technology · third win in under a week", side: "Sep 2025", prize: "₹10,000" },
  { title: "GPU Poster Fest 2.0, 1st place", sub: "SRM IST · GPU-Core Tune, a scheduling framework for idle NVIDIA cores", side: "Nov 2025" },
  { title: "Innovate 2K25, 1st of 423", sub: "Velammal Institute of Technology · two-day national project competition", side: "Aug 2025", prize: "₹5,000" },
  { title: "Technova · Qubitron 2k25, 1st place", sub: "CIT Coimbatore · an NVIDIA principal architect on the jury", side: "Mar 2025", prize: "₹12,000" },
  { title: "Databricks × Accenture Hackathon, winner", sub: "SRM Chennai · GenAI with Databricks AI Gateway, MLflow, LangGraph and FastAPI", side: "Winner" },
  { title: "Creators Clash, 1st place (UI/UX design)", sub: "Cryptrix 2024, St. Joseph's College of Engineering", side: "Sep 2024", prize: "₹3,000" },
  { title: "HackNDroid 3rd of 122 · SparkTank 3.0 3rd · Hackforge 2nd of 60", sub: "VIT Chennai · Vishnu Institute, Andhra Pradesh · SRM Vadapalani", side: "2025", prize: "₹53,000" },
  { title: "Amazon ML Challenge 2026, top ~6%", sub: "Entity resolution across 10,564 teams · public F0.5 0.9846 · team lead", side: "Sep 2026" },
  { title: "Open source: 30 merged PRs", sub: "Roboflow Supervision (credited in v0.29.0), rf-detr, Roboflow Inference, sqlfluff, snowflake-connector-python, copperhead", side: "2025 to 2026", href: "https://github.com/adhavan18" },
];
