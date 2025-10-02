import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluidSimulation } from './FluidSimulation';

function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{
        color: '#fff',
        fontFamily: 'sans-serif',
        marginBottom: '20px',
        position: 'absolute',
        top: '20px',
        zIndex: 10,
      }}>
        2D Euler Fluid Simulation
      </h1>
      <FluidSimulation
        width={1024}
        height={720}
        dissipation={0.01}
        velDissipation={0.1}
        velocityScale={200}
        splatRadius={0.06}
        splatSpeed={10}
        splatColor={[1, 0.4, 0.1, 1]}
        buoyancy={-50}
        jacobiIterations={120}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          border: '1px solid #333',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '20px',
        color: '#888',
        fontFamily: 'sans-serif',
        fontSize: '14px',
      }}>
        Click and drag to add dye • Use color picker to change dye color
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
