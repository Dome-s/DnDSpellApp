import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      size="icon"
      variant="outline"
      className="ml-auto h-11 w-11 rounded-lg bg-card border-border hover:bg-secondary"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-foreground" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4 text-foreground" aria-hidden="true" />
      )}
    </Button>
  );
};
