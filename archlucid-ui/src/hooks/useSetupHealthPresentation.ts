"use client";

import { useEffect, useState } from "react";

import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import {
  resolveSetupHealthPresentation,
  type SetupHealthPresentation,
} from "@/lib/setup-health-present";

type SetupHealthLoadPhase = "loading" | "ready";

export type UseSetupHealthPresentationResult = {
  readonly phase: SetupHealthLoadPhase;
  readonly presentation: SetupHealthPresentation | null;
};

/** Loads `/health/ready` once and resolves operator setup-health presentation. */
export function useSetupHealthPresentation(): UseSetupHealthPresentationResult {
  const [phase, setPhase] = useState<SetupHealthLoadPhase>("loading");
  const [presentation, setPresentation] = useState<SetupHealthPresentation | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const body = await fetchHealthReadySummary().catch(() => null);

      if (cancelled) {
        return;
      }

      setPresentation(resolveSetupHealthPresentation(body));
      setPhase("ready");
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { phase, presentation };
}
