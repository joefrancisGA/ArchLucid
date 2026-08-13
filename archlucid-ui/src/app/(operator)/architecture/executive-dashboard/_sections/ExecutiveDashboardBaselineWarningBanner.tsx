"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { useWorkspaceBaselineArtifactsPresence } from "@/hooks/use-workspace-baseline-artifacts";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Session-dismiss key — discarded when the browser tab ends. */

const EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY: string =
  "archlucid-dashboard-baseline-upload-warning-dismissed";

/** Baseline-first new-run wizard (`?baseline=1`) — cloud inventory ZIP upload before identity. */

export const EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF = "/architecture/reviews/new?baseline=1";

/** Prominent nudge when no cloud inventory baseline artifact exists in the active workspace. */

export type ExecutiveDashboardBaselineWarningBannerProps = {
  /** `setup` renders a neutral optional-setup card; `banner` keeps the legacy alert strip. */
  readonly variant?: "banner" | "setup";
};

export function ExecutiveDashboardBaselineWarningBanner({
  variant = "banner",
}: ExecutiveDashboardBaselineWarningBannerProps = {}) {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const { loading: artifactsLoading, hasBaselineArtifacts } = useWorkspaceBaselineArtifactsPresence();
  const [sessionDismissed, setSessionDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY) === "1") {
      setSessionDismissed(true);
    }
  }, []);

  const operatorOrAdminTier: boolean =
    !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;

  // `hasBaselineArtifacts === false`: no persisted extractor ZIP in workspace; `null` / `true` hides the banner.

  if (sessionDismissed || !operatorOrAdminTier || artifactsLoading || hasBaselineArtifacts !== false) {
    return null;
  }

  if (variant === "setup") {
    return (
      <div
        className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-al-text-primary dark:border-neutral-800 dark:bg-neutral-950/40", OPERATOR_TYPOGRAPHY.body)}
        data-testid="executive-baseline-upload-setup-card"
      >
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{v.baselineInventorySectionTitle}</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{v.baselineInventorySectionDescription}</p>
        <div className="mt-3">
          <Button asChild size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600">
            <Link
              href={EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF}
              data-testid="executive-baseline-upload-wizard-link"
            >
              {v.baselineInventoryUploadAction}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-amber-700/50 sm:flex-row sm:items-start sm:justify-between", OPERATOR_TYPOGRAPHY.body)}
      role="alert"
      data-testid="executive-baseline-upload-warning-banner"
    >
      <div className="min-w-0 flex-1">
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.cardTitle)}>Upload workspace baseline inventory</p>
        <p className={cn("mb-0 mt-2 text-amber-900/95 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.body)}>
          {CLOUD_NEUTRAL_PRIMARY_COPY.executiveBaselineBannerBody}
        </p>
        <div className="mt-3">
          <Button asChild size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600">
            <Link
              href={EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF}
              data-testid="executive-baseline-upload-wizard-link"
            >
              {v.baselineInventoryUploadAction}
            </Link>
          </Button>
        </div>
      </div>

      <DismissControl
        ariaLabel="Dismiss baseline reminder for this session"
        data-testid="executive-baseline-upload-warning-dismiss"
        className="self-end border-neutral-400 text-al-text-primary sm:self-start dark:border-neutral-600"
        onDismiss={() => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY, "1");
          }

          setSessionDismissed(true);
        }}
      />
    </div>
  );
}
