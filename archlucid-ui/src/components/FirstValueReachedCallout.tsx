"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const DISMISS_KEY = "archlucid_first_value_callout_dismissed_v1";

type TrialStatusPayload = {
  firstCommitUtc?: string | null;
  trialWelcomeRunId?: string | null;
};

export type FirstValueReachedCalloutProps = {
  readonly className?: string;
};

/** TB-260 — dismissible success callout when trial first manifest is committed. */
export function FirstValueReachedCallout(props: FirstValueReachedCalloutProps) {
  const [visible, setVisible] = useState(false);
  const [welcomeRunId, setWelcomeRunId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    let canceled = false;

    void (async () => {
      try {
        const res = await fetch(
          "/api/proxy/v1/tenant/trial-status",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok || canceled) {
          return;
        }

        const json = (await res.json()) as TrialStatusPayload;
        const committed = json.firstCommitUtc?.trim() ?? "";
        const welcomeId = json.trialWelcomeRunId?.trim() ?? "";

        if (!committed || !welcomeId) {
          return;
        }

        setWelcomeRunId(welcomeId);
        setVisible(true);
      } catch {
        // Non-blocking home surface.
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

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
        A committed signed review record is on your tenant. Open the pre-seeded welcome review to see findings and next steps.
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
