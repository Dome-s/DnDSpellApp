import './App.css';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';

const SpellBrowserPage = lazy(() => import('./pages/SpellBrowserPage'));
const FluidSimPage = lazy(() => import('./pages/FluidSimPage'));
const ThreeDTestPage = lazy(() => import('./pages/3dtestPage'));

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
          <div className="app-container">
            <Navigation />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/spell-browser" element={<SpellBrowserPage />} />
                <Route path="/fluid-simulation" element={<FluidSimPage />} />
                <Route path="/3d-test" element={<ThreeDTestPage />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
