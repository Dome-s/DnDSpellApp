import React from 'react';
import ProjectCard from '../components/ProjectCard';
import './Home.css';

const Home = () => {
  const projects = [
    {
      title: 'D&D Spell Browser',
      description: 'A comprehensive spell reference tool for Dungeons & Dragons 5th Edition. Filter and search through hundreds of spells from multiple sourcebooks with an intuitive, modern interface.',
      tags: ['React', 'JavaScript', 'D&D', 'Filter System'],
      link: '/spell-browser',
      icon: '📚',
    },
    {
      title: 'Fluid Simulation',
      description: 'An interactive Eulerian fluid simulation built with WebGL2. Create mesmerizing fluid dynamics with mouse movements and touch interactions in real-time.',
      tags: ['WebGL2', 'JavaScript', 'Physics', 'Interactive'],
      link: '/fluid-simulation',
      icon: '🌊',
    },
  ];

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">
          Welcome to My Portfolio
        </h1>
        <p className="home-subtitle">
          Explore interactive projects built with modern web technologies
        </p>
      </div>

      <div className="home-projects">
        <h2 className="projects-heading">Featured Projects</h2>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
