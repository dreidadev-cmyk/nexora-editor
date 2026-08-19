import React, { createContext, useContext, useEffect, useState } from "react";
import { AppTheme, UserSettings } from "../types";

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  setTheme: (theme: AppTheme) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  fontSize: 14,
  tabSize: 2,
  minimap: true,
  wordWrap: true,
  autoSave: true,
  autoSaveDelay: 1500,
  formatOnSave: true,
  lineNumbers: true,
  fontLigatures: true,
  aiProvider: "gemini",
};

const SETTINGS_STORAGE_KEY = "nexora_user_settings";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore fallback
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}

    // Apply theme classes to root element
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light", "theme-amoled", "theme-nord", "theme-cyberpunk");
    root.classList.add(`theme-${settings.theme}`);

    if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
  }, [settings]);

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const setTheme = (theme: AppTheme) => {
    updateSettings({ theme });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setTheme, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};
