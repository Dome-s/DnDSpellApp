import './App.css';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import Navigation from './components/Navigation';
import Home from './pages/Home';

// Lazy load heavy pages
const SpellBrowserPage = lazy(() => import('./pages/SpellBrowserPage'));
const FluidSimPage = lazy(() => import('./pages/FluidSimPage'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg text-muted-foreground">Loading...</div>
  </div>
);

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
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/spell-browser" element={<SpellBrowserPage />} />
                <Route path="/fluid-simulation" element={<FluidSimPage />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
