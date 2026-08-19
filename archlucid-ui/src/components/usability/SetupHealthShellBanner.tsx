"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useSetupHealthPresentation } from "@/hooks/useSetupHealthPresentation";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_CALLOUT_WARN_CLASS } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

type SetupHealthShellBannerProps = {
  readonly className?: string;
};

/**
 * App-wide setup health alert — shown only when readiness is not healthy.
 * Replaces the old top-nav "Setup healthy" chip (telemetry belongs in workspace status, not primary nav).
 */
export function SetupHealthShellBanner(props: SetupHealthShellBannerProps): React.JSX.Element | null {
  const { phase, presentation } = useSetupHealthPresentation();

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (phase !== "ready" || presentation === null || presentation.isHealthy) {
    return null;
  }

  return (
    <div
      className={cn(OPERATOR_CALLOUT_WARN_CLASS, "mb-3 shadow-sm", props.className)}
      role="alert"
      data-testid="setup-health-shell-banner"
    >
      <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">{presentation.label}</p>
      <p className="m-0 mt-1 leading-snug">
        {presentation.tone === "unknown"
          ? "Some workspace services are unavailable."
          : "Workspace setup is not fully ready."}{" "}
        <Link
          href="/help/troubleshooting"
          className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
        >
          Open troubleshooting
        </Link>{" "}
        or review{" "}
        <Link href="/administration/system-health" className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100">
          system health
        </Link>
        .
      </p>
    </div>
  );
}
