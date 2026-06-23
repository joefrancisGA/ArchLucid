"use client";

import { useEffect, useState } from "react";

import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import type { CorePilotCommitPresentationContext } from "@/lib/core-pilot-step-presentation";

const emptyContext: CorePilotCommitPresentationContext = {
  hasCommittedManifest: false,
  latestCommittedRunId: null,
};

/** Loads tenant commit state for Core Pilot step-5 sample vs finalized review CTAs. */
export function useCorePilotCommitPresentationContext(): CorePilotCommitPresentationContext {
  const [context, setContext] = useState<CorePilotCommitPresentationContext>(emptyContext);

  useEffect(() => {
    let cancelled = false;

    void fetchCorePilotCommitContext()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setContext({
          hasCommittedManifest: result.hasCommittedManifest,
          latestCommittedRunId: result.firstCommittedRunId ?? result.latestRunId,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setContext(emptyContext);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return context;
}
