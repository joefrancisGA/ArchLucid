"use client";

import { OperatorFirstRunWorkflowPanel } from "@/components/operator/OperatorFirstRunWorkflowPanel";
import { SamplePackageShortcutsCard } from "@/components/operator-home/SamplePackageShortcutsCard";
import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { fetchCorePilotCommitContextCached } from "@/lib/core-pilot-commit-context";
import {
  isBuyerPolishedOperatorShellEnv,
  isBuyerSafeDemoMarketingChromeEnv,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";
import { useEffect, useState } from "react";

const emptyCommitContext: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

/**
 * Wraps {@link OperatorFirstRunWorkflowPanel}: in buyer-safe demo builds, the right rail elevates reviewing the
 * completed Claims Intake spine over pure first-run language. Hidden entirely in buyer-polished operator shell
 * to reduce CTA noise — the sample review card on the main column is sufficient.
 *
 * {@link SamplePackageShortcutsCard} renders immediately on the curated rail (no commit-context probe).
 */
export function HomeFirstRunWorkflowGate() {
  const exploreCompletedOutput = isBuyerSafeDemoMarketingChromeEnv();
  const curatedShortcutsRail = !isOperatorExperienceFullShellEnv();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const needsCommitProbe = !exploreCompletedOutput && !curatedShortcutsRail && !buyerPolishedShell;

  const [commitCtx, setCommitCtx] = useState<CorePilotCommitContext | null>(() => {
    if (exploreCompletedOutput) {
      return { ...emptyCommitContext, hasCommittedManifest: true };
    }

    if (!needsCommitProbe) {
      return emptyCommitContext;
    }

    return null;
  });

  useEffect(() => {
    if (!needsCommitProbe) {
      return;
    }

    let canceled = false;

    void (async () => {
      try {
        const ctx = await fetchCorePilotCommitContextCached();

        if (!canceled) {
          setCommitCtx(ctx);
        }
      } catch {
        if (!canceled) {
          setCommitCtx(emptyCommitContext);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [needsCommitProbe]);

  if (buyerPolishedShell) {
    return null;
  }

  if (curatedShortcutsRail) {
    return <SamplePackageShortcutsCard />;
  }

  if (commitCtx === null) {
    return <div className="min-h-[100px] w-full" aria-hidden />;
  }

  if (commitCtx.hasCommittedManifest && !exploreCompletedOutput) {
    return null;
  }

  return <OperatorFirstRunWorkflowPanel exploreCompletedOutput={exploreCompletedOutput} />;
}
