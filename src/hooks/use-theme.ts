import { useCallback, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";

const STORAGE_KEY = "almost-theme";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePref | null;
    const initial = stored ?? "system";
    setPref(initial);
    const apply = (p: ThemePref) => {
      const dark = p === "dark" || (p === "system" && systemPrefersDark());
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    apply(initial);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as ThemePref | null) ?? "system";
      apply(current);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((p: ThemePref) => {
    localStorage.setItem(STORAGE_KEY, p);
    const dark = p === "dark" || (p === "system" && systemPrefersDark());
    document.documentElement.classList.toggle("dark", dark);
    setPref(p);
    setIsDark(dark);
  }, []);

  const toggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return { pref, isDark, setTheme, toggle };
}
