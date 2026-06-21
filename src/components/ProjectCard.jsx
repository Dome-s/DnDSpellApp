import React from 'react';
import { Link } from 'react-router-dom';
import './ProjectCard.css';

const ProjectCard = ({ title, eyebrow, description, tags, link, accent }) => {
  return (
    <Link to={link} className={`project-card project-card-${accent}`}>
      <div className="project-card-topline">
        <span className="project-card-eyebrow">{eyebrow}</span>
        <span className="project-card-mark" aria-hidden="true" />
      </div>
      <h3 className="project-card-title">{title}</h3>
      <p className="project-card-description">{description}</p>
      <div className="project-card-tags">
        {tags.map((tag) => (
          <span key={tag} className="project-tag">
            {tag}
          </span>
        ))}
      </div>
      <div className="project-card-action">
        View Details <span aria-hidden="true">-&gt;</span>
      </div>
    </Link>
  );
};

export default ProjectCard;
