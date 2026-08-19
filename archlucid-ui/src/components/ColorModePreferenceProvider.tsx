"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  applyColorModePreference,
  persistColorModePreference,
  persistColorModePreferenceToServer,
  readStoredColorModePreference,
  readSystemPrefersDark,
  resolveColorModeAppearance,
  syncColorModePreferenceFromServer,
  type ColorModePreference,
  type ResolvedColorModeAppearance,
} from "@/lib/color-mode-preference";

export type ColorModeAccountSyncState = "idle" | "synced" | "local-only";

type ColorModePreferenceContextValue = {
  readonly preference: ColorModePreference;
  readonly resolvedAppearance: ResolvedColorModeAppearance;
  readonly systemPrefersDark: boolean;
  readonly mounted: boolean;
  readonly accountSyncState: ColorModeAccountSyncState;
  readonly setAndPersist: (next: ColorModePreference) => void;
};

const ColorModePreferenceContext = createContext<ColorModePreferenceContextValue | null>(null);

function hydrateColorModePreferenceFromCache(): {
  readonly preference: ColorModePreference;
  readonly systemPrefersDark: boolean;
} {
  const preference = readStoredColorModePreference();
  const systemPrefersDark = readSystemPrefersDark();

  applyColorModePreference(preference, systemPrefersDark);

  return {
    preference,
    systemPrefersDark,
  };
}

/** Single source of truth for color-mode preference, OS resolution, and DOM application. */
export function ColorModePreferenceProvider(props: { readonly children: ReactNode }) {
  const [preference, setPreference] = useState<ColorModePreference>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [accountSyncState, setAccountSyncState] = useState<ColorModeAccountSyncState>("idle");
  const preferenceRef = useRef<ColorModePreference>("system");

  useEffect(() => {
    const hydrated = hydrateColorModePreferenceFromCache();

    preferenceRef.current = hydrated.preference;
    setPreference(hydrated.preference);
    setSystemPrefersDark(hydrated.systemPrefersDark);
    setMounted(true);

    void syncColorModePreferenceFromServer().then((syncedPreference) => {
      if (syncedPreference === null) {
        return;
      }

      const prefersDark = readSystemPrefersDark();

      preferenceRef.current = syncedPreference;
      setPreference(syncedPreference);
      setSystemPrefersDark(prefersDark);
      applyColorModePreference(syncedPreference, prefersDark);
      setAccountSyncState("synced");
    });
  }, []);

  useEffect(() => {
    if (!mounted || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = (): void => {
      const prefersDark = media.matches;

      setSystemPrefersDark(prefersDark);

      if (preferenceRef.current === "system") {
        applyColorModePreference("system", prefersDark);
      }
    };

    media.addEventListener("change", onChange);

    return (): void => {
      media.removeEventListener("change", onChange);
    };
  }, [mounted]);

  const setAndPersist = useCallback((next: ColorModePreference) => {
    const prefersDark = readSystemPrefersDark();

    preferenceRef.current = next;
    setPreference(next);
    setSystemPrefersDark(prefersDark);
    persistColorModePreference(next, prefersDark);
    void persistColorModePreferenceToServer(next).then((synced) => {
      setAccountSyncState(synced ? "synced" : "local-only");
    });
  }, []);

  const resolvedAppearance = resolveColorModeAppearance(preference, systemPrefersDark);

  const value = useMemo<ColorModePreferenceContextValue>(
    () => ({
      preference,
      resolvedAppearance,
      systemPrefersDark,
      mounted,
      accountSyncState,
      setAndPersist,
    }),
    [accountSyncState, mounted, preference, resolvedAppearance, setAndPersist, systemPrefersDark],
  );

  return (
    <ColorModePreferenceContext.Provider value={value}>
      {props.children}
    </ColorModePreferenceContext.Provider>
  );
}

export function useColorModePreferenceContext(): ColorModePreferenceContextValue {
  const context = useContext(ColorModePreferenceContext);

  if (context === null) {
    throw new Error("useColorModePreferenceContext must be used within ColorModePreferenceProvider.");
  }

  return context;
}
