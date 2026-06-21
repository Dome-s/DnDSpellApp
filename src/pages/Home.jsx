import React from 'react';
import ProjectCard from '../components/ProjectCard';
import './Home.css';

const Home = () => {
  const projects = [
    {
      title: 'D&D Spell Browser',
      eyebrow: 'Tool',
      description: 'Search, filter, and compare 5th Edition spells from multiple sourcebooks with saved favorites and readable details.',
      tags: ['React', 'JavaScript', 'D&D', 'Filter System'],
      link: '/spell-browser',
      accent: 'arcane',
    },
    {
      title: 'Fluid Simulation',
      eyebrow: 'Simulation',
      description: 'A WebGL2 Eulerian fluid simulation with pointer and touch input, live dye controls, and real-time rendering.',
      tags: ['WebGL2', 'JavaScript', 'Physics', 'Interactive'],
      link: '/fluid-simulation',
      accent: 'fluid',
    },
  ];

  return (
    <div className="home">
      <div className="home-hero">
        <p className="home-kicker">Selected Work</p>
        <h1 className="home-title">Projects, experiments, and notes.</h1>
        <p className="home-subtitle">
          A growing collection of software projects, interactive experiments, and
          information pages for work worth documenting.
        </p>
      </div>

      <div className="home-projects">
        <div className="projects-heading-row">
          <h2 className="projects-heading">Projects</h2>
        </div>
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
