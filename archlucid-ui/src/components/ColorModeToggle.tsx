"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

const storageKey = "archlucid_color_mode";

export type ColorModePreference = "light" | "dark" | "system";

function readStoredPreference(): ColorModePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw;
    }
  } catch {
    // ignore
  }

  return "system";
}

function applyPreference(pref: ColorModePreference): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement.classList;
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = pref === "dark" || (pref === "system" && prefersDark);

  if (dark) {
    root.add("dark");
  }
  else {
    root.remove("dark");
  }
}

/**
 * Light / dark / system toggle for the operator shell. Persists to localStorage and applies `.dark` on `<html>`.
 */
export function ColorModeToggle() {
  const [preference, setPreference] = useState<ColorModePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = readStoredPreference();

    setPreference(initial);
    applyPreference(initial);
  }, []);

  useEffect(() => {
    if (!mounted || preference !== "system") {
      return;
    }

    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = (): void => {
      applyPreference("system");
    };

    media.addEventListener("change", onChange);

    return (): void => media.removeEventListener("change", onChange);
  }, [mounted, preference]);

  const setAndPersist = useCallback((next: ColorModePreference) => {
    setPreference(next);

    try {
      window.localStorage.setItem(storageKey, next);
    }
    catch {
      // ignore
    }

    applyPreference(next);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        style={{ minWidth: 200, height: 32 }}
      />
    );
  }

  const buttonBase: CSSProperties = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };

  const active: CSSProperties = {
    ...buttonBase,
    background: "#0f766e",
    color: "#fff",
    borderColor: "#0f766e",
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
      role="group"
      aria-label="Color mode"
    >
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Theme</span>
      <button
        type="button"
        style={preference === "light" ? active : buttonBase}
        className="auth-panel-focus"
        onClick={() => setAndPersist("light")}
      >
        Light
      </button>
      <button
        type="button"
        style={preference === "dark" ? active : buttonBase}
        className="auth-panel-focus"
        onClick={() => setAndPersist("dark")}
      >
        Dark
      </button>
      <button
        type="button"
        style={preference === "system" ? active : buttonBase}
        className="auth-panel-focus"
        onClick={() => setAndPersist("system")}
      >
        System
      </button>
    </div>
  );
}
