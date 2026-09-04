"use client";

import { useMemo } from "react";

import { WorkspaceAiAvailabilityPanel } from "@/components/reviews/WorkspaceAiAvailabilityPanel";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  OPERATOR_CALLOUT_WARN_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { resolveShellAiConfigurationSignal } from "@/lib/resolve-shell-ai-configuration-signal";
import { resolveShellAiReadinessRecoverySteps } from "@/lib/resolve-shell-ai-readiness-recovery-steps";
import { REAL_MODE_AI_READINESS_BLOCKED_TITLE } from "@/lib/simulator-mode-chrome-copy";
import { cn } from "@/lib/utils";

type RealModeAiReadinessShellBannerProps = {
  readonly className?: string;
};

/** Persistent Live AI readiness status for Real-mode operator shell sessions. */
export function RealModeAiReadinessShellBanner(
  props: RealModeAiReadinessShellBannerProps,
): React.JSX.Element | null {
  const readiness = useSessionAiReadiness();

  const workspaceAiSignal = useMemo(
    () => resolveShellAiConfigurationSignal(readiness),
    [readiness],
  );

  const recoverySteps = useMemo(
    () => resolveShellAiReadinessRecoverySteps(readiness),
    [readiness],
  );

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!readiness.isSessionReal || readiness.isReady) {
    return null;
  }

  const isChecking = readiness.probeState.status === "loading" || readiness.isLoading;

  return (
    <div
      className={cn(OPERATOR_CALLOUT_WARN_CLASS, "mb-3 shadow-sm", props.className)}
      role="status"
      aria-busy={isChecking}
      data-testid="real-mode-ai-readiness-shell-banner"
    >
      <p className={cn("m-0 font-semibold text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        {REAL_MODE_AI_READINESS_BLOCKED_TITLE}
      </p>

      <div className="mt-3">
        <WorkspaceAiAvailabilityPanel
          workspaceAiSignal={workspaceAiSignal}
          availabilityCheck={{
            state: readiness.probeState,
            checkAvailability: readiness.checkAvailability,
          }}
        />
      </div>

      {recoverySteps.length > 0 ? (
        <div className="mt-3" data-testid="real-mode-ai-readiness-recovery-steps">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>What to do</p>
          <ol
            className={cn("m-0 mt-2 list-decimal space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          >
            {recoverySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
