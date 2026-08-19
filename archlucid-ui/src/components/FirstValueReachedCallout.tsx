"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";

const DISMISS_KEY = "archlucid_first_value_callout_dismissed_v1";

export type FirstValueReachedCalloutProps = {
  readonly className?: string;
};

/** TB-260 — dismissible success callout when trial first manifest is committed. */
export function FirstValueReachedCallout(props: FirstValueReachedCalloutProps) {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { data: trialPayload } = useTenantTrialStatusQuery({ enabled: concernFetchEnabled });
  const [dismissed, setDismissed] = useState(true);
  const [welcomeRunId, setWelcomeRunId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);

      return;
    }

    setDismissed(false);
  }, []);

  useEffect(() => {
    if (dismissed || trialPayload === undefined) {
      return;
    }

    const committed = trialPayload?.firstCommitUtc?.trim() ?? "";
    const welcomeId = trialPayload?.trialWelcomeRunId?.trim() ?? "";

    if (!committed || !welcomeId) {
      setVisible(false);
      setWelcomeRunId(null);

      return;
    }

    setWelcomeRunId(welcomeId);
    setVisible(true);
  }, [dismissed, trialPayload]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }

    setVisible(false);
  }, []);

  if (!visible || !welcomeRunId) {
    return null;
  }

  const reviewHref = `/architecture/reviews/${welcomeRunId.replace(/-/g, "")}`;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.success, "p-4", props.className)}
      data-testid="first-value-reached-callout"
      role="status"
    >
      <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>
        Your first architecture review is ready — open it
      </p>
      <p className={cn("mt-1 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        A committed sealed review record is on your tenant. Open the pre-seeded welcome review to see findings and next steps.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link href={reviewHref} data-testid="first-value-reached-open-review">
            Open review
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/help/first-architecture-review">What this means</Link>
        </Button>
        <DismissControl data-testid="first-value-reached-dismiss" onDismiss={dismiss} />
      </div>
    </div>
  );
}
