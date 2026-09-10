"use client";

import { Suspense, type ReactNode } from "react";

import { useResumePendingLivelihoodMutation } from "@/hooks/use-resume-pending-livelihood-mutation";

/**
 * Shell-level livelihood 401 resume (LW-052). Replays once on a safe returnPath match after re-auth.
 * Cross-tab signal: `storage` events on `archlucid.livelihoodPendingMutation_v2` re-run the hook.
 */
function AppShellLivelihoodMutationResumeInner(): null {
  useResumePendingLivelihoodMutation({ enabled: true });

  return null;
}

export function AppShellLivelihoodMutationResumeHost(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AppShellLivelihoodMutationResumeInner />
    </Suspense>
  );
}
