"use client";

import { useEffect, useState, type ReactNode } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";

const DEFAULT_PROJECT_ID = "default";

type Phase = "loading" | "ready";

/**
 * Hides tertiary operator-home surfaces until at least one run exists for the default project,
 * avoiding a chorus of empty-state cards on first visit. Fails open on fetch/guard errors so
 * returning operators still see metrics if the lightweight list call fails.
 */
export function OperationalMetricsGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [hasRuns, setHasRuns] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase("loading");

      try {
        const raw: unknown = await listRunsByProjectPaged(DEFAULT_PROJECT_ID, 1, 1);
        const coerced = coerceRunSummaryPaged(raw);

        if (cancelled) {
          return;
        }

        if (!coerced.ok) {
          setHasRuns(true);
          setPhase("ready");

          return;
        }

        setHasRuns(coerced.value.totalCount > 0);
        setPhase("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setHasRuns(true);
        setPhase("ready");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return null;
  }

  if (phase === "ready" && !hasRuns) {
    return null;
  }

  return <>{children}</>;
}
