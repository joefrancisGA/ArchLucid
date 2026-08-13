"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useDeferredOperatorShellStatusQueriesEnabled } from "@/hooks/use-deferred-operator-shell-status-queries-enabled";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";
import {
  BUYER_DEMO_EVALUATION_WORKSPACE_BADGE,
  BUYER_DEMO_EVALUATION_WORKSPACE_STATUS,
  BUYER_TRY_SAMPLE_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

type TrialNextAction = {
  readonly label: string;
  readonly href: string;
};

function resolveTrialNextAction(payload: TenantTrialStatusPayload | null): TrialNextAction {
  if (payload?.trialSampleRunId !== null && payload?.trialSampleRunId !== undefined && payload.trialSampleRunId.trim().length > 0) {
    return {
      label: "Explore sample review",
      href: `/architecture/reviews/${encodeURIComponent(payload.trialSampleRunId.trim())}`,
    };
  }

  if (payload?.status === "Active") {
    return { label: "Commit your first review", href: "/architecture/reviews" };
  }

  if (payload?.status === "Expired" || payload?.status === "ReadOnly" || payload?.status === "ExportOnly") {
    return { label: "Convert to paid", href: "/pricing#pricing-quote-request" };
  }

  return {
    label: "Open onboarding checklist",
    href: "/architecture/first-review-guide?source=registration",
  };
}

/** Persistent trial strip with days remaining and a single primary next action (all operator routes). */
export function PersistentTrialStatusStrip() {
  const pathname = usePathname();
  const deferredReady = useDeferredOperatorShellStatusQueriesEnabled();
  const { data: payload } = useTenantTrialStatusQuery({ enabled: deferredReady });
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (payload === null || payload === undefined || payload.status === "None" || payload.status === "Converted") {
    return null;
  }

  if (pathname === "/") {
    return null;
  }

  if (buyerPolishedShell && payload.status === "Active") {
    return (
      <div
        className={cn(
          "mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="region"
        aria-label="Workspace status"
        data-testid="persistent-trial-status-strip"
      >
        <div className="min-w-0 flex items-center gap-2">
          <span className={cn("rounded border border-neutral-300 bg-white px-1.5 py-0.5 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300", OPERATOR_NAV_GROUP_LABEL)}>
            {BUYER_DEMO_EVALUATION_WORKSPACE_BADGE}
          </span>
          <span className="text-neutral-700 dark:text-neutral-300">{BUYER_DEMO_EVALUATION_WORKSPACE_STATUS}</span>
        </div>
        <Button asChild type="button" size="sm" variant="outline" className={cn("h-7", OPERATOR_TYPOGRAPHY.button)}>
          <Link href={`/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>{BUYER_TRY_SAMPLE_REVIEW_CTA}</Link>
        </Button>
      </div>
    );
  }

  const nextAction = resolveTrialNextAction(payload);
  const days = payload.daysRemaining;
  const daysLabel =
    typeof days === "number" ? `${days} day${days === 1 ? "" : "s"} left on trial` : "Trial workspace";

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="region"
      aria-label="Trial status"
      data-testid="persistent-trial-status-strip"
    >
      <div className="min-w-0 flex items-center gap-2">
        <span className={cn("rounded border border-neutral-300 bg-white px-1.5 py-0.5 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300", OPERATOR_NAV_GROUP_LABEL)}>
          Trial
        </span>
        <span className="text-neutral-700 dark:text-neutral-300">{daysLabel}</span>
      </div>
      <Button asChild type="button" size="sm" variant="outline" className={cn("h-7", OPERATOR_TYPOGRAPHY.button)}>
        <Link href={nextAction.href}>{nextAction.label}</Link>
      </Button>
    </div>
  );
}
