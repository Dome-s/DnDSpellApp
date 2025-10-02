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
          width={1024}
          height={720}
          dissipation={0.01}
          velDissipation={0.1}
          velocityScale={200}
          splatRadius={0.07}
          splatSpeed={20}
          splatColor={[1, 0.4, 0.1, 1]}
          buoyancy={-4}
          jacobiIterations={120}
        />
      </div>
    </div>
  );
};

export default FluidSimPage;
