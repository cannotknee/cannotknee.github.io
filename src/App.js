import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import BarChart from "./components/BarChart.js";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";
import Project from "./components/Project";
import MouseGlow from "./components/MouseGlow.js";
import { ReactComponent as GitHubIcon } from "./assets/github.svg";
import { ReactComponent as LinkedInIcon } from "./assets/linkedin.svg";
import { ReactComponent as EmailIcon } from "./assets/email.svg";
import HDB from "./assets/HDB.jpg";
import FEAST from "./assets/FEAST.png";
import Monstyr from "./assets/Monstyr.jpg";
import Resume from "./assets/Kenny Ong Ker Chin - Resume.pdf";
import Experience from "./components/Experience";
import MouseDot from "./components/MouseDot.js";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { easing } from "maath";

function Suzanne(props) {
  const mesh = useRef();
  const { nodes } = useGLTF("./suzanne.glb");
  const [dummy] = useState(() => new THREE.Object3D());
  useFrame((state, dt) => {
    dummy.lookAt(state.pointer.x, state.pointer.y, 1);
    easing.dampQ(mesh.current.quaternion, dummy.quaternion, 0.15, dt);
  });
  return (
    <mesh ref={mesh} geometry={nodes.Suzanne.geometry} scale={[2, 2, 2]} {...props}>
      <meshNormalMaterial />
    </mesh>
  );
}

function App() {
  const { scrollYProgress } = useScroll();
  const [animationStep, setAnimationStep] = useState(0);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep((prevStep) => prevStep + 1);
    }, 1200); // Adjust the delay between each step as needed

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Function to handle the intersection
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.classList.add("active"); // Add the active class when the element is in view
        }
      });
    };

    // Create an intersection observer
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "0px", // You can adjust this margin if needed
      threshold: 0.7, // You can adjust the threshold for when the element is considered in view
    });

    // Add elements to be observed
    const elementsToObserve = document.querySelectorAll(".container");
    elementsToObserve.forEach((element) => {
      observer.observe(element);
    });

    // Clean up the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, []); // Empty dependency array ensures this runs only once on component mount

  return (
    <div className="App">
      <motion.div className="progress-bar" style={{ scaleX }} />
      <MouseDot />
      <MouseGlow />
      <nav>
        <ul>
          <li>
            <a href="#home" className="nav-item">
              Home
            </a>
          </li>
          <li>
            <a href="#about" className="nav-item">
              About
            </a>
          </li>
          <li>
            <a href="#experience" className="nav-item">
              Experience
            </a>
          </li>
          <li>
            <a href="#projects" className="nav-item">
              Projects
            </a>
          </li>
          <li>
            <a href="#contact" className="nav-item">
              Contact
            </a>
          </li>
        </ul>
      </nav>
      <header className="page-header" role="banner" id="home">
        <div className="intro">
          <h1 className={`project-name ${animationStep >= 1 ? "active" : ""}`}>
            Hello,
          </h1>
          <h1 className={`project-name ${animationStep >= 2 ? "active" : ""}`}>
            My name is
            <span className={`highlight ${animationStep >= 3 ? "active" : ""}`}>
              Kenny Ong
            </span>
          </h1>
          <h1
            className={`project-tagline ${animationStep >= 4 ? "active" : ""}`}
          >
            A Full Stack Web Developer
          </h1>
          <motion.a
            initial={{ opacity: 0, y: 20 }} // Initial animation properties
            animate={{ opacity: 1, y: 0 }} // Animation properties when button is visible
            transition={{ delay: 6 }} // Delay before animation starts
            whileHover={{ scale: 1.2 }} // Animation properties on hover
            whileTap={{ scale: 0.6 }} // Animation properties when button is tapped
            href="#about"
            className={`btn`}
          >
            View my work
          </motion.a>
        </div>
      </header>
      <main id="content" className="main-content" role="main">
        <style type="text/css" media="screen"></style>
        <div className="container" id="about">
          <h2>ABOUT</h2>
          <p>
            I'm a software engineer at HCLTech. With a strong passion for creating intuitive
            and dynamic user experiences, I strive to craft engaging and
            user-centric digital solutions. I am actively seeking opportunities
            to apply my skills and knowledge in a professional setting, where I
            can contribute to impactful projects and continue to grow as a
            developer.
          </p>
          <Canvas camera={{ position: [0, 0.1, 5] }}>
            <ambientLight />
            <directionalLight position={[10, 10, 10]} />
            <Suzanne />
          </Canvas>
        </div>
        <div className="container" id="skills">
          <h2>MY SKILLS</h2>
          <BarChart />
        </div>
        <div className="container" id="experience">
          <h2>EXPERIENCE</h2>
          <Experience
            title="Software Engineer @ HCLTech"
            timeline="Jul 24 – Current"
            description="I participated in the Spark Accelerator Programme (Graduate Software Engineer 2024), a 3-month intensive training focused on development within the Microsoft Business Application Practice (MBAP). During the program, I worked on a project for a government agency, where I applied my skills in custom API development, JavaScript, Dataverse, Power BI, and plugin integration. I contributed directly to the project’s success by delivering solutions that utilized these technologies to meet the agency's needs."
            techStack={[
              "C#",
              "Javascript",
              "Typescript",
              ".NET",
              "PowerApps",
              "PowerBI",
            ]}
            link="https://www.hcltech.com/"
          />
          <Experience
            title="Systems Analyst @ Synapxe"
            timeline="May 23 – Aug 23"
            description="I analyzed user requirements, conducted system integration testing, and supported project management efforts. By developing automated solutions for data analysis, I provided actionable insights, empowering our organization to make informed decisions and enhance efficiency."
            techStack={[
              "Jira",
              "Project management",
              "Agile",
              "Requirements Gathering",
            ]}
            link="https://www.synapxe.sg/"
          />
          <Experience
            title="Software Engineer @ Zumvet"
            timeline="Aug 22 – Dec 22"
            description="I worked closely with a team of engineers to develop a web application enabling users to book online pet consultations and manage their pet's health. Using TypeScript, Express, and React, I enhanced the application by optimizing code and improving technical documentation. Additionally, I managed and retrieved data from the MySQL server using DBeaver, ensuring accuracy and integrity. By integrating new features for pet management and order processing, we streamlined company operations and enhanced the user experience on the website."
            techStack={[
              "Typescript",
              "React",
              "SQL",
              "CSS/LESS",
              "Express",
              "Next.js",
            ]}
            link="https://www.zumvet.com/"
          />
        </div>
        <div className="container" id="projects">
          <h2>ACADEMIC PROJECTS</h2>
          {/* Project 1 */}
          <Project
            title="HDB Resale Flat Price Prediction"
            description="This project addresses Singapore's housing affordability challenge by predicting Housing Development Board (HDB) resale flat prices using various models. The dataset undergoes preprocessing steps, including data cleaning, feature selection, and normalization. The project explores multiple algorithms, including Decision Tree, Gradient Boosting, Random Forest, LSTM, Stacked LSTM, and XGBoost. Evaluation methodologies encompass ARIMA and machine learning models."
            techStack={["Machine learning", "Python", "Tensorflow", "Scikit"]}
            link="https://github.com/cannotknee/50.038-CDS-Project"
            imageSrc={HDB}
          />

          {/* Project 2 */}
          <Project
            title="Food Establishment Autonomous Spatial Tracking (FEAST)"
            description="FEAST is a real time crowd tracking app that allows users to conveniently check the current crowd levels at various food and beverage establishments in SUTD. Using the app, users can avoid establishments that are crowded, or choose to come back later. Gone are the days when users need to waste time queueing and thus can better plan their day to avoid large crowds."
            techStack={["Java", "Android Studio", "Figma"]}
            link="https://istd.sutd.edu.sg/term4-design-exhibition/50001/food-establishment-autonomous-spatial-tracking-feast?PageSpeed=noscript"
            imageSrc={FEAST}
          />

          {/* Project 3 */}
          <Project
            title="Automated Product Extraction Dashboard"
            description="Automated Product Extraction Dashboard, developed by Team 1-to-1 in collaboration with Monstyr, addresses the labor-intensive process of manually extracting data and images from promotional posters for Monstyr's lifestyle mobile app. The solution is a web application that offers one-click image uploading, automated extraction, cropping, and easy exporting of product images. This streamlines Monstyr's data management and enhances the efficiency of adding promotions and deals to their app."
            techStack={["Ruby on Rails", "Google Cloud Services", "Heroku"]}
            link="https://sites.google.com/view/team-1-to-1/home?pli=1"
            imageSrc={Monstyr}
          />
        </div>
      </main>
      <footer className="site-footer">
        <div className="container" id="contact">
          <h2>CONTACT</h2>
          <p>
            Have a question or want to work together? <br />
            Feel free to contact me <br />
            <button
              className="download-button"
              href={Resume}
              download="Kenny Ong Ker Chin - Resume"
              target="_blank"
              rel="noreferrer"
            >
              Download CV
            </button>
          </p>
          <div className="site-footer-social">
            <a
              href="mailto: cankneeong@gmail.com"
              target="_blank"
              rel="noreferrer"
            >
              <EmailIcon />
            </a>
            <a
              href="https://www.linkedin.com/in/canknee/"
              target="_blank"
              rel="noreferrer"
            >
              <LinkedInIcon />
            </a>
            <a
              href="https://github.com/cannotknee"
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
        <span className="site-footer-owner">
          <a
            href="https://www.linkedin.com/in/canknee/"
            target="_blank"
            rel="noreferrer"
          >
            Kenny Ong Ker Chin
          </a>{" "}
          © 2024 All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default App;
