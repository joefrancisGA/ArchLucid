"use client";

import { useCallback, useEffect, useState } from "react";

import {
  applyColorModePreference,
  persistColorModePreference,
  persistColorModePreferenceToServer,
  readStoredColorModePreference,
  readSystemPrefersDark,
  syncColorModePreferenceFromServer,
  type ColorModePreference,
} from "@/lib/color-mode-preference";

export function useUserAppearancePreferenceServerSync(): void {
  useEffect(() => {
    void syncColorModePreferenceFromServer();
  }, []);
}

export function useUserAppearancePreference(): {
  readonly preference: ColorModePreference;
  readonly systemPrefersDark: boolean;
  readonly mounted: boolean;
  readonly setAndPersist: (next: ColorModePreference) => void;
} {
  const [preference, setPreference] = useState<ColorModePreference>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const localPreference = readStoredColorModePreference();
    const prefersDark = readSystemPrefersDark();

    setMounted(true);
    setSystemPrefersDark(prefersDark);
    setPreference(localPreference);
    applyColorModePreference(localPreference, prefersDark);
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
        applyColorModePreference("system", prefersDark);
      }
    };

    media.addEventListener("change", onChange);

    return (): void => media.removeEventListener("change", onChange);
  }, [mounted, preference]);

  const setAndPersist = useCallback(
    (next: ColorModePreference) => {
      setPreference(next);
      persistColorModePreference(next, systemPrefersDark);
      void persistColorModePreferenceToServer(next);
    },
    [systemPrefersDark],
  );

  return {
    preference,
    systemPrefersDark,
    mounted,
    setAndPersist,
  };
}
