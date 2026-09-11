"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { LivelihoodMutationResumeChrome } from "@/components/shell/LivelihoodMutationResumeChrome";
import { useResumePendingLivelihoodMutation } from "@/hooks/use-resume-pending-livelihood-mutation";
import { isOperatorOidcKeepaliveRoute } from "@/lib/auth/operator-oidc-keepalive-route";

/**
 * Shell-level livelihood 401 resume (LW-052 / LW-066). Replays once on a safe returnPath match after re-auth.
 * Cross-tab signal: `storage` events on `archlucid.livelihoodPendingMutation_v2` re-run the hook.
 */
function AppShellLivelihoodMutationResumeInner(): ReactNode {
  const pathname = usePathname() ?? "";
  const enabled = isOperatorOidcKeepaliveRoute(pathname);
  const { chrome, confirmReplay, discardReplay } = useResumePendingLivelihoodMutation({ enabled });

  if (chrome === null) {
    return null;
  }

  return (
    <LivelihoodMutationResumeChrome
      isReplaying={chrome.isReplaying}
      onConfirm={confirmReplay}
      onDiscard={discardReplay}
      presentation={chrome.presentation}
      replayErrorMessage={chrome.replayErrorMessage}
    />
  );
}

export function AppShellLivelihoodMutationResumeHost(): ReactNode {
  return (
    <Suspense fallback={null}>
      <AppShellLivelihoodMutationResumeInner />
    </Suspense>
  );
}
