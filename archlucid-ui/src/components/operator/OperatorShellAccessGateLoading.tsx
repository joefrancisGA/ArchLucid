"use client";

import { useEffect, useState } from "react";

import { GenericPageSkeleton } from "@/components/skeletons/GenericPageSkeleton";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const ACCESS_GATE_STALLED_MS = 8_000;

export type OperatorShellAccessGateLoadingProps = {
  readonly title?: string;
};

/**
 * Neutral placeholder while operator shell authority or home access resolves.
 * Intentionally omits sidebar, top bar, and product nav labels (TB-730).
 */
export function OperatorShellAccessGateLoading({ title }: OperatorShellAccessGateLoadingProps): React.JSX.Element {
  const { retryAuthorityLoad, currentPrincipal } = useOperatorNavAuthority();
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setStalled(true), ACCESS_GATE_STALLED_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const meTimedOut = currentPrincipal.syntheticReason === "me-timeout";

  return (
    <div
      data-testid="operator-shell-access-gate-loading"
      className="flex min-h-[50vh] flex-1 flex-col items-start gap-4 pt-8"
      role="status"
      aria-busy="true"
      aria-label={title ?? "Loading workspace"}
    >
      {title !== undefined ? (
        <h1 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>{title}</h1>
      ) : null}
      <GenericPageSkeleton />
      {stalled ? (
        <div
          className={cn("space-y-3", DESIGN_TOKENS.callout.warn, "max-w-prose px-4 py-3")}
          data-testid="operator-shell-access-gate-stalled"
        >
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Workspace access is taking longer than expected.
            {meTimedOut ? " Your sign-in profile request timed out." : null}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="operator-shell-access-gate-retry"
            onClick={retryAuthorityLoad}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
