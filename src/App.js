import "./App.css";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Project from "./components/Project";
import SectionHeader from "./components/SectionHeader";
import MouseGlow from "./components/MouseGlow.js";
import { ReactComponent as GitHubIcon } from "./assets/github.svg";
import { ReactComponent as LinkedInIcon } from "./assets/linkedin.svg";
import { ReactComponent as EmailIcon } from "./assets/email.svg";
import HDB from "./assets/HDB.png";
import FEAST from "./assets/FEAST.png";
import Monstyr from "./assets/Monstyr.png";
import JapaneseTutor from "./assets/JapaneseTutor.png";
import ReactIcon from "./assets/react.png";
import NextIcon from "./assets/next.png";
import NodeIcon from "./assets/node.png";
import ExpressIcon from "./assets/express.png";
import JavaScriptIcon from "./assets/javascript.png";
import HtmlIcon from "./assets/html.png";
import CssIcon from "./assets/css.png";
import GitIcon from "./assets/git.png";
import Resume from "./assets/Kenny Ong Ker Chin - Resume.pdf";
import Experience from "./components/Experience";
import MouseDot from "./components/MouseDot.js";
import NavBar from "./components/NavBar.js";
import { Spaceman } from "./components/Spaceman.js";
import ShootingStars from "./components/ShootingStars";
import HeroAurora from "./components/HeroAurora";
import ParallaxStars from "./components/ParallaxStars";
import Parallax from "./components/Parallax";
import ScrollAurora from "./components/ScrollAurora";

import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";

const TECH_ICONS = [
  { icon: ReactIcon, label: "React" },
  { icon: NextIcon, label: "Next.js" },
  { icon: NodeIcon, label: "Node.js" },
  { icon: ExpressIcon, label: "Express" },
  { icon: JavaScriptIcon, label: "JavaScript" },
  { icon: HtmlIcon, label: "HTML" },
  { icon: CssIcon, label: "CSS" },
  { icon: GitIcon, label: "Git" },
];

function App() {
  const projects = [
    {
      title: "Japanese Tutor",
      description:
        "A voice-first Japanese conversation tutor built on one rule: correct after the full sentence, never mid-utterance. Speak in Japanese, receive Claude-powered corrections with diff highlights and furigana, then keep talking. Whisper transcribes your speech; each mistake automatically seeds a spaced-repetition review queue.",
      techStack: ["React", "TypeScript", "Node.js", "Claude AI", "Whisper STT", "Tailwind CSS"],
      link: "https://github.com/cannotknee/japanese-tutor",
      imageSrc: JapaneseTutor,
    },
    {
      title: "HDB Resale Flat Price Prediction",
      description:
        "Predicts Housing Development Board resale flat prices across Singapore using multiple ML models, addressing the challenge of housing affordability transparency.",
      techStack: ["Machine Learning", "Python", "TensorFlow", "Scikit-learn"],
      link: "https://github.com/cannotknee/50.038-CDS-Project",
      imageSrc: HDB,
    },
    {
      title: "Food Establishment Autonomous Spatial Tracking (FEAST)",
      description:
        "Real-time crowd tracking app that surfaces live occupancy data for food establishments in SUTD, helping users plan around peak hours without queueing.",
      techStack: ["Java", "Android Studio", "Figma"],
      imageSrc: FEAST,
    },
    {
      title: "Automated Product Extraction Dashboard",
      description:
        "Built in collaboration with Monstyr — eliminates manual extraction from promotional posters with one-click upload, automated cropping, and bulk export for their lifestyle app.",
      techStack: ["Ruby on Rails", "Google Cloud Services", "Heroku"],
      link: "https://sites.google.com/view/team-1-to-1/home?pli=1",
      imageSrc: Monstyr,
    }
  ];

  const { scrollYProgress } = useScroll();
  const [animationStep, setAnimationStep] = useState(0);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Soft spring for parallax — lower stiffness = more floaty
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 55, damping: 20 });
  // Text drifts up slowly; spaceman drifts faster — creates depth separation.
  // Spread over a larger fraction of total scroll + bigger offsets so the
  // hero takes more scrolling to clear and the motion reads as more dramatic.
  const heroTextY = useTransform(smoothScroll, [0, 0.32], [0, -90]);
  const heroSceneY = useTransform(smoothScroll, [0, 0.32], [0, -160]);

  // Vertical timeline line draws in as a pure function of scroll progress
  // through the timeline's own bounds — scrubs both ways with scroll.
  const timelineRef = useRef(null);
  const { scrollYProgress: timelineProgress } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 60%"],
  });
  const timelineLineScale = useTransform(timelineProgress, [0, 1], [0, 1]);

  useEffect(() => {
    if (animationStep >= 4) return;
    const timer = setTimeout(() => {
      setAnimationStep((s) => s + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [animationStep]);

  // The two hero <Canvas> scenes (ParallaxStars, Spaceman) are React Three
  // Fiber WebGL contexts that default to frameloop="always" — they render
  // every animation frame forever, even fully scrolled out of view. Two
  // continuous WebGL render loops running underneath the whole rest of the
  // page was starving the main thread (measured ~15fps at idle, scrolled
  // all the way to Projects, zero interaction) and is what made every
  // cursor-driven effect look jerky, not any particular effect's own math.
  // Unmount them entirely — not just visually hide — once the hero scrolls
  // out of view so R3F tears down the WebGL context and its render loop.
  const heroRef = useRef(null);
  const [heroInView, setHeroInView] = useState(true);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="App">
      <ScrollAurora progress={scrollYProgress} />
      <ShootingStars />
      <motion.div className="progress-bar" style={{ scaleX }} />
      <MouseDot />
      <MouseGlow />
      <NavBar visible={animationStep >= 4} />
      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>

      <section className="page-header" role="banner" id="home" ref={heroRef}>
        <div className="hero-canvas" aria-hidden="true">
          {heroInView && (
            <Canvas camera={{ position: [0, 0, 1], fov: 60 }} gl={{ alpha: true }}>
              <ParallaxStars />
            </Canvas>
          )}
        </div>
        <HeroAurora />

        <div className="hero-inner">
          <motion.div className="intro" style={{ y: heroTextY }}>
            <p className={`hero-label ${animationStep >= 1 ? "active" : ""}`}>
              Software Engineer · Singapore
            </p>
            <h1 className={`hero-name ${animationStep >= 2 ? "active" : ""}`}>
              Kenny Ong
            </h1>
            <p className={`hero-tagline ${animationStep >= 3 ? "active" : ""}`}>
              Adaptable engineer. Building with AI.
            </p>
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 0.6 }}
            >
              <a href="#about" className="btn">
                <span className="btn-text">View my work</span>
              </a>
              <a
                href={Resume}
                download="Kenny Ong Ker Chin - Resume"
                className="btn-ghost"
              >
                Resume
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className={`hero-scene ${animationStep >= 4 ? "active" : ""}`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: animationStep >= 4 ? 1 : 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: heroSceneY }}
          >
            <div className="orbit-scene">
              <Suspense fallback={null}>
                {heroInView && (
                  <Canvas camera={{ position: [0, 0, 0.48] }}>
                    <Spaceman />
                    <ambientLight />
                    <directionalLight position={[10, 10, 10]} />
                    <CameraControls />
                  </Canvas>
                )}
              </Suspense>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 1 }}
        >
          <div className="scroll-line" />
        </motion.div>
      </section>

      <main id="content" className="main-content" role="main">
        <section className="about-wrapper" id="about">
          <Parallax speed={90} fade fromX={-180} className="about-text-parallax">
            <div className="about-text">
              <SectionHeader number="01" title="About" underlineOnly />
              <p>
                I'm a software engineer who uses AI to move faster without cutting corners — at every stage, from research to review. Speed matters to me, but so does getting it right; I treat AI as the tool that compounds both.
              </p>
              <p>
                This portfolio was built with Claude Code. Japanese Tutor, a voice-first language app, runs on the Claude API. I've picked up multiple stacks quickly — Rails, Java, the Microsoft stack, React — and I try to leave code that's easy to reason about wherever I land.
              </p>
            </div>
          </Parallax>

          <Parallax speed={90} fade fromX={180} className="about-skills-orbit-parallax">
            <div className="about-skills-orbit" aria-hidden="true">
              <div className="orbit-ring">
                {TECH_ICONS.map(({ icon, label }, i) => (
                  <div
                    key={label}
                    className="orbit-item"
                    style={{ '--angle': `${i * 45}deg`, '--glow-delay': `${i * 0.5}s` }}
                  >
                    <div className="orbit-icon-inner">
                      <img src={icon} alt="" className="orbit-icon-img" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Parallax>
        </section>

        <section className="container" id="experience">
          <SectionHeader number="02" title="Experience" />
          <div className="timeline" ref={timelineRef}>
            <motion.div
              className="timeline-line"
              style={{ scaleY: timelineLineScale }}
            />
            <Parallax speed={34} fade>
              <div className="timeline-item">
                <Experience
                  title="Software Engineer @ HCLTech"
                  timeline="Jul 24 – Present"
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
                  timeline="May 23 – Aug 23"
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
                  timeline="Aug 22 – Dec 22"
                  description="Worked with a team to build a web app for online pet consultations and health management. Enhanced the platform using TypeScript, Express, and React — optimizing performance and improving technical documentation."
                  techStack={["TypeScript", "React", "SQL", "CSS/LESS", "Express", "Next.js"]}
                  link="https://www.zumvet.com/"
                />
              </div>
            </Parallax>
          </div>
        </section>

        <section className="project-wrapper" id="projects">
          <SectionHeader number="03" title="Projects" />
          <Project projects={projects} />
        </section>
      </main>

      <footer className="site-footer">
        <section className="container" id="contact">
          <SectionHeader number="04" title="Contact" />
          <Parallax fade speed={20} className="footer-content">
            <p>
              Open to new opportunities and interesting projects.<br />
              Feel free to reach out.
            </p>
            <a
              className="download-button"
              href={Resume}
              download="Kenny Ong Ker Chin - Resume"
              target="_blank"
              rel="noreferrer"
            >
              Download Resume
            </a>
            <div className="site-footer-social">
              <a href="mailto:cankneeong@gmail.com" target="_blank" rel="noreferrer">
                <EmailIcon />
              </a>
              <a href="https://www.linkedin.com/in/canknee/" target="_blank" rel="noreferrer">
                <LinkedInIcon />
              </a>
              <a href="https://github.com/cannotknee" target="_blank" rel="noreferrer">
                <GitHubIcon />
              </a>
            </div>
          </Parallax>
        </section>
        <span className="site-footer-owner">
          <a href="https://www.linkedin.com/in/canknee/" target="_blank" rel="noreferrer">
            Kenny Ong Ker Chin
          </a>{" "}
          © 2026 All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default App;
