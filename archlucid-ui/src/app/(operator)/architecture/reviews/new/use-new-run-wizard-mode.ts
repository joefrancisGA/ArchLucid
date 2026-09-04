"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useNewRunWizardCommittedProbeQuery } from "@/hooks/use-new-run-wizard-committed-probe-query";
import { resolveFirstRunWizardMode } from "@/lib/core-pilot-step-presentation";
import {
  newRunWizardModeHrefFromSearch,
  parseNewRunWizardModeFromSearch,
} from "@/lib/runs/new-run-wizard-mode-url";

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
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const urlMode = parseNewRunWizardModeFromSearch(searchParams.get("mode"));
  const [wizardMode, setWizardMode] = useState<NewRunWizardMode>(
    () => urlMode ?? readStoredWizardMode() ?? "quick",
  );
  // A deep link (accelerator, preset) or a click has already decided the mode, so the first-run probe
  // below must not overwrite it when its request resolves.
  const modeChosenRef = useRef(false);
  const storedMode = readStoredWizardMode();
  const committedProbeQuery = useNewRunWizardCommittedProbeQuery({
    enabled: !baselineFirst && storedMode === null,
  });

  const persistWizardMode = useCallback(
    (mode: NewRunWizardMode) => {
      modeChosenRef.current = true;
      setWizardMode(mode);
      writeStoredWizardMode(mode);
      router.replace(newRunWizardModeHrefFromSearch(searchParams.toString(), mode, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const nextMode = parseNewRunWizardModeFromSearch(searchParams.get("mode"));

    if (nextMode !== null) {
      setWizardMode(nextMode);
      modeChosenRef.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!baselineFirst) {
      return;
    }

    persistWizardMode("quick");
  }, [baselineFirst, persistWizardMode]);

  useEffect(() => {
    if (baselineFirst || storedMode !== null || modeChosenRef.current) {
      return;
    }

    if (committedProbeQuery.isSuccess && committedProbeQuery.data !== undefined) {
      setWizardMode(
        resolveFirstRunWizardMode({
          hasCommittedManifest: committedProbeQuery.data.hasCommittedManifest,
          storedMode: null,
        }),
      );

      return;
    }

    if (committedProbeQuery.isError && !modeChosenRef.current) {
      setWizardMode("quick");
    }
  }, [
    baselineFirst,
    committedProbeQuery.data,
    committedProbeQuery.isError,
    committedProbeQuery.isSuccess,
    storedMode,
  ]);

  return { wizardMode, persistWizardMode };
}
