import "./App.css";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import Project from "./components/Project";
import SectionHeader from "./components/SectionHeader";
import { ReactComponent as GitHubIcon } from "./assets/github.svg";
import { ReactComponent as LinkedInIcon } from "./assets/linkedin.svg";
import { ReactComponent as EmailIcon } from "./assets/email.svg";
import HDB from "./assets/HDB.webp";
import FEAST from "./assets/FEAST.webp";
import Monstyr from "./assets/Monstyr.webp";
import JapaneseTutor from "./assets/JapaneseTutor.webp";
import Resume from "./assets/Kenny Ong Ker Chin - Resume.pdf";
import Experience from "./components/Experience";
import MouseDot from "./components/MouseDot.js";
import NavBar from "./components/NavBar.js";
import Hud from "./components/Hud";
import ShibaChat from "./components/ShibaChat";
import Parallax from "./components/Parallax";
import SectionReveal from "./components/SectionReveal";

// three.js + R3F are most of the bundle. Splitting them out lets the hero
// text paint on the first small chunk; the starfield fades in behind it.
const SpaceJourney = lazy(() => import("./components/SpaceJourney"));

// Pre-flight check, played once on load (skippable with any input, skipped
// entirely under reduced motion). Four quick lines, then the title stamps in.
const BOOT_LINES = [
  ["KO-2026 FLIGHT SYSTEMS", "ONLINE"],
  ["TELEMETRY LINK", "ESTABLISHED"],
  ["CREW ABOARD", "1 ENGINEER / 1 SHIBA"],
  ["MISSION", "BUILD WITH AI"],
];
const BOOT_TOTAL = BOOT_LINES.length + 2; // + title, + actions

function App() {
  const projects = [
    {
      title: "Japanese Tutor",
      code: "P-01",
      description:
        "A voice-first conversation partner I built to practise my own spoken Japanese. Say a sentence and Yoshimi, an Osaka-raised tutor persona, corrects only the mistakes worth fixing, then replies in character using just the grammar and vocabulary from the textbook lessons I've covered — kept in bounds by a local RAG pipeline over みんなの日本語. Mistakes come back later as spoken spaced-repetition reviews. Speech output and embeddings run locally, so a turn costs about a tenth of a cent.",
      techStack: [
        "React",
        "TypeScript",
        "Express",
        "SQLite + sqlite-vec",
        "RAG",
        "OpenAI",
        "VOICEVOX",
        "FSRS",
      ],
      link: "https://github.com/cannotknee/japanese-tutor",
      imageSrc: JapaneseTutor,
    },
    {
      title: "HDB Resale Flat Price Prediction",
      code: "P-02",
      description:
        "Predicts Housing Development Board resale flat prices across Singapore using multiple ML models, addressing the challenge of housing affordability transparency.",
      techStack: ["Machine Learning", "Python", "TensorFlow", "Scikit-learn"],
      link: "https://github.com/cannotknee/50.038-CDS-Project",
      imageSrc: HDB,
    },
    {
      title: "Food Establishment Autonomous Spatial Tracking",
      code: "P-03",
      description:
        "Real-time crowd tracking app that surfaces live occupancy data for food establishments in SUTD, helping users plan around peak hours without queueing.",
      techStack: ["Java", "Android Studio", "Figma"],
      imageSrc: FEAST,
    },
    {
      title: "Automated Product Extraction Dashboard",
      code: "P-04",
      description:
        "Built in collaboration with Monstyr — eliminates manual extraction from promotional posters with one-click upload, automated cropping, and bulk export for their lifestyle app.",
      techStack: ["Ruby on Rails", "Google Cloud Services", "Heroku"],
      link: "https://sites.google.com/view/team-1-to-1/home?pli=1",
      imageSrc: Monstyr,
    },
  ];

  const shouldReduceMotion = useReducedMotion();
  const [bootStep, setBootStep] = useState(() => (shouldReduceMotion ? BOOT_TOTAL : 0));
  const bootDone = bootStep >= BOOT_TOTAL;

  useEffect(() => {
    if (bootDone) return undefined;
    const delay = bootStep === 0 ? 220 : bootStep < BOOT_LINES.length ? 150 : 280;
    const timer = setTimeout(() => setBootStep((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [bootStep, bootDone]);

  // Any input skips straight past the boot sequence — never hold a visitor
  // hostage to an intro.
  useEffect(() => {
    if (bootDone) return undefined;
    const skip = () => setBootStep(BOOT_TOTAL);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchstart", skip, { passive: true });
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [bootDone]);

  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 55, damping: 20 });
  const heroTextY = useTransform(smoothScroll, [0, 0.32], [0, -90]);

  // Vertical flight-log line draws in as a pure function of scroll progress
  // through the timeline's own bounds — scrubs both ways with scroll.
  const timelineRef = useRef(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 60%"],
  });
  const timelineLineScale = useTransform(timelineProgress, [0, 1], [0, 1]);
  const timelineBeaconTop = useTransform(timelineProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="App">
      <Suspense fallback={null}>
        <SpaceJourney />
      </Suspense>
      <MouseDot />
      <NavBar visible={bootDone} />
      <Hud visible={bootDone} />
      <ShibaChat visible={bootDone} />

      <section className="page-header" role="banner" id="home">
        <div className="hero-inner">
          <motion.div className="intro" style={{ y: heroTextY }}>
            <div className="boot-lines" aria-hidden="true">
              {BOOT_LINES.map(([label, status], i) => (
                <span key={label} className={`boot-line ${bootStep > i ? "boot-line-on" : ""}`}>
                  <span className="boot-line-label">{label}</span>
                  <span className="boot-line-dots" />
                  <span className="boot-line-status">{status}</span>
                </span>
              ))}
            </div>

            <h1 className={`hero-name ${bootStep > BOOT_LINES.length ? "active" : ""}`}>
              Kenny
              <br />
              Ong
            </h1>
            <p className={`hero-tagline ${bootStep > BOOT_LINES.length ? "active" : ""}`}>
              Software engineer, Singapore. Adaptable across stacks —
              <em> building with AI.</em>
            </p>
            <div className={`hero-actions ${bootDone ? "active" : ""}`}>
              <a href="#about" className="btn">
                Begin flight ↓
              </a>
              <a href={Resume} download="Kenny Ong Ker Chin - Resume" className="btn-ghost">
                Flight papers
              </a>
            </div>
          </motion.div>
        </div>

        <div className={`scroll-indicator ${bootDone ? "active" : ""}`}>
          <span className="scroll-hint">SCROLL TO FLY</span>
          <div className="scroll-line" />
        </div>
      </section>

      <main id="content" className="main-content" role="main">
        <section id="about">
          <SectionReveal className="about-wrapper" variant="warp">
            <Parallax speed={90} fade fromX={-180} className="about-text-parallax">
              <div className="about-text">
                <SectionHeader number="PHASE 01" title="Crew Manifest" underlineOnly />
                <p>
                  I'm a software engineer in Singapore. By day I build for a government client on
                  the Microsoft stack at HCLTech; the rest of the time I'm usually building something
                  with AI, just to see how far it goes.
                </p>
                <p>
                  Two of those side missions: Japanese Tutor, a voice-first conversation partner I use
                  to practise my own Japanese, and a personal AI assistant I run on{" "}
                  <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noreferrer" className="text-link">
                    OpenClaw
                  </a>{" "}
                  that handles my reminders, alerts and PC upkeep over Telegram. This site was built
                  with Claude Code.
                </p>
                <p>
                  I've picked up stacks quickly — Rails, Java, .NET, React — and I try to leave code
                  that's easy to reason about wherever I land.
                </p>
                <dl className="crew-card">
                  <div className="crew-row">
                    <dt>CALLSIGN</dt>
                    <dd>CANKNEE</dd>
                  </div>
                  <div className="crew-row">
                    <dt>ROLE</dt>
                    <dd>SOFTWARE ENGINEER</dd>
                  </div>
                  <div className="crew-row">
                    <dt>BASE</dt>
                    <dd>SINGAPORE / GMT+8</dd>
                  </div>
                  <div className="crew-row">
                    <dt>SYSTEMS</dt>
                    <dd>TS · C# · REACT · PYTHON</dd>
                  </div>
                  <div className="crew-row">
                    <dt>LEARNING</dt>
                    <dd lang="ja">日本語</dd>
                  </div>
                  <div className="crew-row">
                    <dt>CO-PILOT</dt>
                    <dd>1 SHIBA · AI-POWERED</dd>
                  </div>
                  <div className="crew-row">
                    <dt>STATUS</dt>
                    <dd className="crew-status">OPEN TO MISSIONS</dd>
                  </div>
                </dl>
              </div>
            </Parallax>

            {/* Empty on purpose: the shiba pilot flies into this seat
                (see PilotShiba waypoints). */}
            <div className="about-copilot-seat" aria-hidden="true" />
          </SectionReveal>
        </section>

        <section id="experience">
          <SectionReveal className="container" variant="dock">
            <SectionHeader number="PHASE 02" title="Flight Log" />
            <div className="timeline" ref={timelineRef}>
              <motion.div className="timeline-line" style={{ scaleY: timelineLineScale }} />
              <motion.div
                className="timeline-beacon"
                style={{ top: timelineBeaconTop }}
                aria-hidden="true"
              />
              <Parallax speed={34} fade>
                <div className="timeline-item">
                  <Experience
                    title="Software Engineer @ HCLTech"
                    timeline="JUL 24 — NOW"
                    description="Joined a graduate programme and shipped quickly on an unfamiliar Microsoft stack — custom API development, Dataverse, Power BI, and plugin integrations for a government client."
                    techStack={["C#", "JavaScript", "TypeScript", ".NET", "PowerApps", "PowerBI"]}
                    link="https://www.hcltech.com/"
                  />
                </div>
              </Parallax>
              <Parallax speed={34} fade>
                <div className="timeline-item">
                  <Experience
                    title="Systems Analyst @ Synapxe"
                    timeline="MAY 23 — AUG 23"
                    description="Analyzed user requirements, conducted system integration testing, and supported project management. Developed automated data analysis solutions that delivered actionable operational insights."
                    techStack={["Jira", "Agile", "Project Management", "Requirements Gathering"]}
                    link="https://www.synapxe.sg/"
                  />
                </div>
              </Parallax>
              <Parallax speed={34} fade>
                <div className="timeline-item">
                  <Experience
                    title="Software Engineer @ Zumvet"
                    timeline="AUG 22 — DEC 22"
                    description="Worked with a team to build a web app for online pet consultations and health management. Enhanced the platform using TypeScript, Express, and React — optimizing performance and improving technical documentation."
                    techStack={["TypeScript", "React", "SQL", "CSS/LESS", "Express", "Next.js"]}
                    link="https://www.zumvet.com/"
                  />
                </div>
              </Parallax>
            </div>
          </SectionReveal>
        </section>

        <section id="projects">
          <SectionReveal className="project-wrapper" variant="deploy">
            <SectionHeader number="PHASE 03" title="Payload" />
            <Project projects={projects} />
          </SectionReveal>
        </section>
      </main>

      <footer className="site-footer">
        <section id="contact">
          <SectionReveal className="container" variant="transmit">
            <SectionHeader number="PHASE 04" title="Open Channel" />
            <div className="footer-content">
              <p className="channel-status" aria-hidden="true">
                CHANNEL OPEN ⁄ ALL FREQUENCIES MONITORED
              </p>
              <p>
                Open to new opportunities and interesting problems.
                <br />
                Transmissions answered from Singapore, GMT+8.
              </p>
              <div className="footer-actions">
                <a className="btn" href="mailto:cankneeong@gmail.com">
                  Transmit ↗
                </a>
                <a
                  className="btn-ghost"
                  href={Resume}
                  download="Kenny Ong Ker Chin - Resume"
                  target="_blank"
                  rel="noreferrer"
                >
                  Flight papers
                </a>
              </div>
              <div className="site-footer-social">
                <a href="mailto:cankneeong@gmail.com" target="_blank" rel="noreferrer" aria-label="Email">
                  <EmailIcon />
                </a>
                <a
                  href="https://www.linkedin.com/in/canknee/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href="https://github.com/cannotknee"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                >
                  <GitHubIcon />
                </a>
              </div>
            </div>
          </SectionReveal>
        </section>
        <span className="site-footer-owner">
          MISSION KO-2026 · BUILT WITH CLAUDE CODE ·{" "}
          <a href="https://www.linkedin.com/in/canknee/" target="_blank" rel="noreferrer">
            © 2026 KENNY ONG KER CHIN
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
