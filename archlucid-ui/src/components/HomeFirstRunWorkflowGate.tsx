"use client";

import { OperatorFirstRunWorkflowPanel } from "@/components/OperatorFirstRunWorkflowPanel";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { isBuyerPolishedOperatorShellEnv, isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { useEffect, useState } from "react";

const emptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  latestRunId: null,
  firstCommittedRunId: null,
};

/**
 * Wraps {@link OperatorFirstRunWorkflowPanel}: in buyer-safe demo builds, the right rail elevates reviewing the
 * completed Claims Intake spine over pure first-run language. Hidden entirely in buyer-polished operator shell
 * to reduce CTA noise — the sample review card on the main column is sufficient.
 */
export function HomeFirstRunWorkflowGate() {
  const exploreCompletedOutput = isBuyerSafeDemoMarketingChromeEnv();
  const [commitCtx, setCommitCtx] = useState<CorePilotCommitContext | null>(
    exploreCompletedOutput ? { ...emptyCommitContext, hasCommittedManifest: true } : null,
  );

  useEffect(() => {
    if (exploreCompletedOutput) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const ctx = await fetchCorePilotCommitContext();

        if (!cancelled) {
          setCommitCtx(ctx);
        }
      } catch {
        if (!cancelled) {
          setCommitCtx(emptyCommitContext);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exploreCompletedOutput]);

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (commitCtx === null) {
    return <div className="min-h-[100px] w-full" aria-hidden />;
  }

  if (commitCtx.hasCommittedManifest && !exploreCompletedOutput) {
    return null;
  }

  return <OperatorFirstRunWorkflowPanel exploreCompletedOutput={exploreCompletedOutput} />;
}
