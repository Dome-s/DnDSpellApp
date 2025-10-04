import React, { useRef } from 'react';
import FluidSimulation from '../components/FluidSim';
import { AmbientRimLight } from '../components/FluidSim/AmbientRimLight';
import './FluidSimPage.css';

const FluidSimPage = () => {
  const canvasRef = useRef(null);

  return (
    <div className="fluid-sim-page">
      <div className="text-center pt-6 pb-4 px-4">
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)]">
          Eulerian Fluid Simulation
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto drop-shadow-sm">
          An interactive WebGL2-based fluid simulation using the Eulerian method.
          Move your mouse or touch to create fluid dynamics.
        </p>
      </div>
      <div className="mx-auto" style={{ maxWidth: '1200px', padding: '100px 0' }}>
        <div className="relative fluid-sim-container" style={{ margin: 0 }}>
          <AmbientRimLight canvasRef={canvasRef} sampleRate={50} />
          <FluidSimulation
            canvasRef={canvasRef}
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
    </div>
  );
};

export default FluidSimPage;
