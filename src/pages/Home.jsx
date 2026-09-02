import React from 'react';
import { Link } from 'react-router-dom';
import FluidSimulation from '../components/FluidSim';
import './Home.css';

const Home = () => {
  return (
    <div className="home">

      <section className="systems-index" aria-label="Selected projects">
        <Link className="system-module spell-system" to="/spell-browser">
          <div className="system-copy">
            <p className="system-number">01 / D&amp;D Spell Browser</p>
            <h2>A reference tool for exploring 5E spell data.</h2>
            <p>
              Spells from multiple sourcebooks with favorites,
              tactical filters, level summaries, and detailed spell inspection.
              Saving prefferences in local storage.
            </p>
          </div>

          <div className="system-preview spell-preview" aria-hidden="true">
            <div className="preview-sidebar">
              <div className="preview-label">Filters</div>
              <div className="preview-input">fire</div>
              <div className="preview-control active">Class: Wizard</div>
              <div className="preview-control">Level 3</div>
              <div className="preview-control">Type: Damage</div>
              <div className="preview-control">Action</div>
              <div className="preview-control">Saving throw</div>
            </div>
            <div className="preview-results">
              <div className="preview-stats">
                <span>18 / 612 spells</span>
                <span>3 prepared</span>
              </div>
              <div className="preview-levels">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span key={level} style={{ '--bar-height': `${level === 3 ? 84 : 24 + level * 7}%` }}>
                    {level === 0 ? 'C' : level}
                  </span>
                ))}
              </div>
              <div className="preview-spell-grid">
                {[
                  { name: 'Fireball', school: 'Evocation', meta: 'DEX save / 8d6 fire', liked: true },
                  { name: "Melf's Minute Meteors", school: 'Evocation', meta: 'DEX save / 2d6 fire' },
                  { name: 'Flame Arrows', school: 'Transmutation', meta: 'Concentration / 1d6' },
                  { name: "Ashardalon's Stride", school: 'Transmutation', meta: 'Bonus action / fire' },
                ].map((spell) => (
                  <div className={`preview-spell-card ${spell.liked ? 'is-liked' : ''}`} key={spell.name}>
                    <div>
                      <span>{spell.school}</span>
                      <strong>{spell.name}</strong>
                    </div>
                    <small>{spell.meta}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>

        <Link className="system-module fluid-system" to="/fluid-simulation">
          <div className="system-copy">
            <p className="system-number">02 / Eulerian Fluid Simulation</p>
            <h2>A realtime graphics experiment built on WebGL2.</h2>
            <p>
              Pointer-driven dye injection, framebuffers, pressure solving, using Eulerian Pressure grids.
            </p>
          </div>

          <div className="system-preview fluid-preview" aria-hidden="true">
            <FluidSimulation
              width={768}
              height={460}
              dissipation={0.006}
              velDissipation={0.08}
              splatRadius={0.1}
              splatSpeed={20}
              splatColor={[1, 0.4, 0.1, 1]}
              buoyancy={-4}
              jacobiIterations={20}
              showControls={false}
            />
          </div>
        </Link>

        <Link className="system-module corridor-system" to="/3d-test">
          <div className="system-copy">
            <p className="system-number">03 / Infinite Hallway</p>
            <h2>A cinematic castle passage that continues without end.</h2>
            <p>
              A Three.js web scene combining baked lightmaps, screen-space
              reflections, volumetric god rays, and a seamless three-section
              recycling system.
            </p>
          </div>

          <div className="system-preview corridor-preview" aria-hidden="true">
            <img
              className="corridor-preview-image"
              src={`${import.meta.env.BASE_URL}Screenshot 2026-09-02 155907.png`}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        </Link>
      </section>
    </div>
  );
};

export default Home;
