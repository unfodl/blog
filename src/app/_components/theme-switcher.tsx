"use client";

import styles from "./switch.module.css";
import { useEffect, useState } from "react";

type ColorSchemePreference = "system" | "dark" | "light";

const STORAGE_KEY = "nextjs-blog-starter-theme";
const modes: ColorSchemePreference[] = ["system", "dark", "light"];

/**
 * Switch button to quickly toggle user preference.
 */
const Switch = () => {
  const [mode, setMode] = useState<ColorSchemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true after component mounts on client
    setMounted(true);
    
    // Initialize mode from localStorage only after mounting
    const savedMode = localStorage.getItem(STORAGE_KEY) as ColorSchemePreference;
    if (savedMode && modes.includes(savedMode)) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply theme
    const applyTheme = () => {
      const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const resolvedMode = mode === 'system' ? systemMode : mode;
      
      // Remove all theme classes
      document.documentElement.classList.remove('dark', 'light');
      
      // Add the resolved theme class
      if (resolvedMode === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Set data-mode attribute
      document.documentElement.setAttribute('data-mode', mode);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, mode);
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, mounted]);

  /** toggle mode */
  const handleModeSwitch = () => {
    const index = modes.indexOf(mode);
    setMode(modes[(index + 1) % modes.length]);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      className={styles.switch}
      onClick={handleModeSwitch}
      aria-label={`Switch to ${modes[(modes.indexOf(mode) + 1) % modes.length]} mode`}
    />
  );
};

/**
 * This component applies theme switching functionality.
 */
export const ThemeSwitcher = () => {
  return <Switch />;
};
