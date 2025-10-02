import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import SpellBrowserPage from './pages/SpellBrowserPage';
import FluidSimPage from './pages/FluidSimPage';

const App = () => {
  return (
    <Router>
      <div className="App">
        <div className="magical-orb magical-orb-1"></div>
        <div className="magical-orb magical-orb-2"></div>
        <div className="magical-orb magical-orb-3"></div>
        <div className="app-container">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/spell-browser" element={<SpellBrowserPage />} />
            <Route path="/fluid-simulation" element={<FluidSimPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
