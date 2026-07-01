"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

type ThemeChoice = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "haoxuan-theme";

function getStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readThemeState() {
  const theme = getStoredTheme();
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  return { theme, resolvedTheme };
}

function getSnapshot(): string {
  const { theme, resolvedTheme } = readThemeState();
  return `${theme}:${resolvedTheme}`;
}

function getServerSnapshot(): string {
  return "system:light";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener("themechange", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("themechange", callback);
    media.removeEventListener("change", callback);
  };
}

export function Providers({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, resolvedTheme] = snapshot.split(":") as [ThemeChoice, ResolvedTheme];
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme(themeChoice: ThemeChoice) {
        window.localStorage.setItem(storageKey, themeChoice);
        window.dispatchEvent(new Event("themechange"));
      },
    }),
    [resolvedTheme, theme],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", value.resolvedTheme === "dark");
  }, [value.resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside Providers");
  return context;
}
