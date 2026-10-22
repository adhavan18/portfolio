import { person, stats, cursors, fit, steps, cases, design, ideas, tools, winPhotos, wins } from "./data.js";
import Hero from "./components/Hero.jsx";
import Fit from "./components/Fit.jsx";
import Flow from "./components/Flow.jsx";
import Work from "./components/Work.jsx";
import Craft from "./components/Craft.jsx";
import Ideas from "./components/Ideas.jsx";
import Wins from "./components/Wins.jsx";
import Chrome from "./components/Chrome.jsx";

export default function App() {
  return (
    <>
      <div className="board" aria-hidden="true" />
      <Chrome person={person} cases={cases} />
      <main id="top">
        <Hero person={person} stats={stats} cursors={cursors} />
        <Fit fit={fit} />
        <Flow steps={steps} />
        <Work cases={cases} />
        <Craft design={design} tools={tools} />
        <Ideas ideas={ideas} />
        <Wins photos={winPhotos} wins={wins} person={person} />
      </main>
    </>
  );
}
