import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import SpellBrowserPage from './pages/SpellBrowserPage';
import FluidSimPage from './pages/FluidSimPage';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <ThemeToggle />
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
    </ThemeProvider>
  );
};

export default App;
