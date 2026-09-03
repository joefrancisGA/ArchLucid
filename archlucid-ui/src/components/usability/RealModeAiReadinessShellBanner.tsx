"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useSessionAiReadiness } from "@/hooks/use-session-ai-readiness";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  REAL_MODE_AI_READINESS_BLOCKED_DETAIL,
  REAL_MODE_AI_READINESS_BLOCKED_TITLE,
  REAL_MODE_DEV_OVERRIDE_HOST_MISMATCH_DETAIL,
} from "@/lib/simulator-mode-chrome-copy";
import { cn } from "@/lib/utils";

type RealModeAiReadinessShellBannerProps = {
  readonly className?: string;
};

/** Loud warning when this browser session is in Real mode but live AI is not ready. */
export function RealModeAiReadinessShellBanner(
  props: RealModeAiReadinessShellBannerProps,
): React.JSX.Element | null {
  const readiness = useSessionAiReadiness();

  const mismatchDetail = useMemo(() => {
    if (!readiness.hasDevOverride || readiness.hostMode === null || readiness.sessionMode === null) {
      return null;
    }

    if (readiness.hostMode === readiness.sessionMode) {
      return null;
    }

    return REAL_MODE_DEV_OVERRIDE_HOST_MISMATCH_DETAIL.replace(
      "{hostMode}",
      readiness.hostMode,
    ).replace("{sessionMode}", readiness.sessionMode);
  }, [readiness.hasDevOverride, readiness.hostMode, readiness.sessionMode]);

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!readiness.isSessionReal || readiness.isLoading || readiness.isReady) {
    return null;
  }

  const isChecking = readiness.probeState.status === "loading";

  return (
    <div
      className={cn(OPERATOR_CALLOUT_WARN_CLASS, "mb-3 shadow-sm", props.className)}
      role="alert"
      data-testid="real-mode-ai-readiness-shell-banner"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={cn("m-0 font-semibold text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
            {REAL_MODE_AI_READINESS_BLOCKED_TITLE}
          </p>
          <p className={cn("m-0 mt-1 leading-snug text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
            {mismatchDetail ?? readiness.detail ?? REAL_MODE_AI_READINESS_BLOCKED_DETAIL}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-amber-700 bg-white text-amber-950 hover:bg-amber-50 dark:border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900/60"
          onClick={() => void readiness.checkAvailability({ force: true })}
          disabled={isChecking}
          data-testid="real-mode-ai-readiness-check-button"
        >
          {isChecking ? "Checking AI availability…" : "Check AI availability"}
        </Button>
      </div>
    </div>
  );
}
