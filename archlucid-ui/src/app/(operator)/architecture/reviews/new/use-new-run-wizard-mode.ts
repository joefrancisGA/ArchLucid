"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { resolveFirstRunWizardMode } from "@/lib/core-pilot-step-presentation";

import { WIZARD_MODE_STORAGE_KEY } from "./new-run-wizard-steps";

export type NewRunWizardMode = "quick" | "full";

function readStoredWizardMode(): NewRunWizardMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(WIZARD_MODE_STORAGE_KEY);

    return stored === "quick" || stored === "full" ? stored : null;
  } catch {
    // Private-mode or blocked storage: fall back to the default mode rather than failing the page.
    return null;
  }
}

function writeStoredWizardMode(mode: NewRunWizardMode): void {
  try {
    window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/**
 * Quick start vs. all steps, remembered per browser.
 *
 * A first-time operator is defaulted to quick start; once any review has a committed manifest, the
 * stored choice wins. The pilot-baseline entry point pins quick start because its four slides are
 * the pilot script.
 */
export function useNewRunWizardMode(baselineFirst: boolean) {
  const [wizardMode, setWizardMode] = useState<NewRunWizardMode>(() => readStoredWizardMode() ?? "quick");
  // A deep link (accelerator, preset) or a click has already decided the mode, so the first-run probe
  // below must not overwrite it when its request resolves.
  const modeChosenRef = useRef(false);

  const persistWizardMode = useCallback((mode: NewRunWizardMode) => {
    modeChosenRef.current = true;
    setWizardMode(mode);
    writeStoredWizardMode(mode);
  }, []);

  useEffect(() => {
    if (!baselineFirst) {
      return;
    }

    persistWizardMode("quick");
  }, [baselineFirst, persistWizardMode]);

  useEffect(() => {
    if (baselineFirst) {
      return;
    }

    let canceled = false;

    void (async () => {
      try {
        const stored = readStoredWizardMode();

        if (stored !== null) {
          return;
        }

        const page = await listRunsByProjectPaged("default", 1, 50);
        const anyCommitted = page.items.some((r) => r.hasGoldenManifest === true);

        if (!canceled && !modeChosenRef.current) {
          setWizardMode(
            resolveFirstRunWizardMode({
              hasCommittedManifest: anyCommitted,
              storedMode: stored,
            }),
          );
        }
      } catch {
        if (!canceled && !modeChosenRef.current) {
          setWizardMode("quick");
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [baselineFirst]);

  return { wizardMode, persistWizardMode };
}
