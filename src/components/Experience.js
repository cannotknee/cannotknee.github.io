import React from "react";
import PropTypes from "prop-types";
import "./Experience.css";
import TiltCard from "./TiltCard";

function Experience({ title, description, techStack, link, timeline }) {
  return (
    <TiltCard
      as="a"
      href={link}
      className="experience-link experience-card"
      innerClassName="experience-card-inner"
      target="_blank"
      rel="noopener noreferrer"
      tiltAmount={3}
      overlay={<span className="diagonal-arrow">↗</span>}
    >
      <div className="experience-timeline">{timeline}</div>
      <div className="experience-details">
        <h3 className="experience-title">{title}</h3>
        <p className="experience-description">{description}</p>
        <div className="experience-tech-container">
          {techStack.map((tech, index) => (
            <span key={index} className="experience-tech">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </TiltCard>
  );
}

Experience.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
  timeline: PropTypes.string.isRequired,
};

export default Experience;
