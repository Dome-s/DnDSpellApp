import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectCard.css';

const ProjectCard = ({ title, description, tags, link, icon }) => {
  return (
    <Link to={link} className="project-card">
      <div className="project-card-icon">{icon}</div>
      <h3 className="project-card-title">{title}</h3>
      <p className="project-card-description">{description}</p>
      <div className="project-card-tags">
        {tags.map((tag, index) => (
          <span key={index} className="project-tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="project-card-arrow">→</div>
    </Link>
  );
};

export default ProjectCard;
