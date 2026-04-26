"use client";

import { useCallback, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
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
        className="min-w-[200px] h-8"
      />
    );
  }

  const segmentInactive =
    "rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100";
  const segmentActive = cn(
    buttonVariants({ variant: "primary", size: "sm" }),
    "min-h-0 !h-auto border border-teal-700 px-2.5 py-1.5 font-semibold dark:border-teal-800",
  );

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Color mode">
      <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Theme</span>
      <button
        type="button"
        className={cn("auth-panel-focus", preference === "light" ? segmentActive : segmentInactive)}
        onClick={() => setAndPersist("light")}
      >
        Light
      </button>
      <button
        type="button"
        className={cn("auth-panel-focus", preference === "dark" ? segmentActive : segmentInactive)}
        onClick={() => setAndPersist("dark")}
      >
        Dark
      </button>
      <button
        type="button"
        className={cn("auth-panel-focus", preference === "system" ? segmentActive : segmentInactive)}
        onClick={() => setAndPersist("system")}
      >
        System
      </button>
    </div>
  );
}
