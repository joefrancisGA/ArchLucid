"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

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

function readSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Whether the UI is currently showing dark styling for the stored preference. */
export function resolveDarkAppearance(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): boolean {
  if (preference === "dark") {
    return true;
  }

  if (preference === "light") {
    return false;
  }

  return systemPrefersDark;
}

/** light → dark → system → opposite of current system appearance (not a redundant light click). */
export function resolveNextColorModePreference(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): ColorModePreference {
  if (preference === "light") {
    return "dark";
  }

  if (preference === "dark") {
    return "system";
  }

  return resolveDarkAppearance("system", systemPrefersDark) ? "light" : "dark";
}

export function buildColorModeToggleLabel(
  preference: ColorModePreference,
  systemPrefersDark: boolean,
): string {
  const resolvedDark = resolveDarkAppearance(preference, systemPrefersDark);
  const appearance = resolvedDark ? "dark" : "light";
  const nextMode = resolveNextColorModePreference(preference, systemPrefersDark);

  if (preference === "system") {
    const nextAppearance = resolveDarkAppearance(nextMode, systemPrefersDark) ? "dark" : "light";

    return `Color mode: system (${appearance}). Activate to switch to ${nextAppearance}.`;
  }

  if (nextMode === "system") {
    const systemAppearance = systemPrefersDark ? "dark" : "light";

    return `Color mode: ${preference}. Activate to match system (${systemAppearance}).`;
  }

  return `Color mode: ${preference}. Activate to switch to ${nextMode}.`;
}

function applyPreference(pref: ColorModePreference, systemPrefersDark: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement.classList;
  const dark = resolveDarkAppearance(pref, systemPrefersDark);

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
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readStoredPreference();
    const prefersDark = readSystemPrefersDark();

    setMounted(true);
    setSystemPrefersDark(prefersDark);
    setPreference(initial);
    applyPreference(initial, prefersDark);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = (): void => {
      const prefersDark = media.matches;

      setSystemPrefersDark(prefersDark);

      if (preference === "system") {
        applyPreference("system", prefersDark);
      }
    };

    media.addEventListener("change", onChange);

    return (): void => media.removeEventListener("change", onChange);
  }, [mounted, preference]);

  const setAndPersist = useCallback(
    (next: ColorModePreference) => {
      setPreference(next);

      try {
        window.localStorage.setItem(storageKey, next);
      }
      catch {
        // ignore
      }

      applyPreference(next, systemPrefersDark);
    },
    [systemPrefersDark],
  );

  if (!mounted) {
    return <div aria-hidden="true" className="h-8 w-8" />;
  }

  const resolvedDark = resolveDarkAppearance(preference, systemPrefersDark);
  const nextMode = resolveNextColorModePreference(preference, systemPrefersDark);
  const icon = resolvedDark ? "🌙" : "☀️";
  const label = buildColorModeToggleLabel(preference, systemPrefersDark);

  return (
    <button
      type="button"
      className={cn(
        "auth-panel-focus flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700",
      )}
      aria-label={label}
      title={label}
      onClick={() => setAndPersist(nextMode)}
    >
      <span aria-hidden className="text-xs">{icon}</span>
    </button>
  );
}
