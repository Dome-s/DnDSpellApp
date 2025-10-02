import React from 'react';
import FluidSimulation from '../components/FluidSim';
import './FluidSimPage.css';

const FluidSimPage = () => {
  return (
    <div className="fluid-sim-page">
      <div className="fluid-sim-header">
        <h1>Eulerian Fluid Simulation</h1>
        <p className="fluid-sim-description">
          An interactive WebGL2-based fluid simulation using the Eulerian method.
          Move your mouse or touch to create fluid dynamics.
        </p>
      </div>
      <div className="fluid-sim-container">
        <FluidSimulation
          simWidth={256}
          simHeight={256}
          dyeResolution={512}
          densityDissipation={0.98}
          velocityDissipation={0.99}
          pressureIterations={20}
          curl={30}
          splatRadius={0.005}
          brightness={0.5}
          backgroundColor={{ r: 0, g: 0, b: 0 }}
          transparent={false}
        />
      </div>
    </div>
  );
};

export default FluidSimPage;
