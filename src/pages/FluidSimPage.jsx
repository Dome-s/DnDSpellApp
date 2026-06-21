import React, { useRef } from 'react';
import FluidSimulation from '../components/FluidSim';
import { AmbientRimLight } from '../components/FluidSim/AmbientRimLight';
import './FluidSimPage.css';

const FluidSimPage = () => {
  const canvasRef = useRef(null);

  return (
    <main className="fluid-sim-page">
      <section className="fluid-sim-hero">
        <p className="fluid-sim-kicker">Simulation</p>
        <div className="fluid-sim-title-row">
          <div>
            <h1>Eulerian Fluid Simulation</h1>
            <p>
              A WebGL2 fluid solver with live pointer and touch input. Drag across
              the canvas to inject dye and velocity into the simulation field.
            </p>
          </div>
          <div className="fluid-sim-meta" aria-label="Simulation details">
            <span>WebGL2</span>
            <span>Eulerian Grid</span>
            <span>Touch Ready</span>
          </div>
        </div>
      </section>

      <section className="fluid-sim-stage" aria-label="Fluid simulation canvas">
        <div className="fluid-sim-stage-header">
          <div>
            <p className="fluid-sim-stage-label">Live Canvas</p>
            <h2>Drag to disturb the field</h2>
          </div>
          <p>Use the color control in the canvas to change dye before drawing.</p>
        </div>
        <div className="fluid-sim-container">
          <AmbientRimLight canvasRef={canvasRef} sampleRate={100} segmentSize={50} />
          <FluidSimulation
            canvasRef={canvasRef}
            width={1024}
            height={600}
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
      </section>
    </main>
  );
};

export default FluidSimPage;
