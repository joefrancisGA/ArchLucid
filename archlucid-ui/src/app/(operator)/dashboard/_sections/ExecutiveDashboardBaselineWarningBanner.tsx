"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { InlineGuidance } from "@/components/InlineGuidance";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { DismissControl } from "@/components/usability/DismissControl";
import { useWorkspaceBaselineArtifactsPresence } from "@/hooks/use-workspace-baseline-artifacts";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Session-dismiss key — discarded when the browser tab ends. */

const EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY: string =
  "archlucid-dashboard-baseline-upload-warning-dismissed";

/** Baseline-first new-run wizard (`?baseline=1`) — Azure extractor ZIP upload before identity. */

export const EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF = "/reviews/new?baseline=1";

/** Prominent nudge when no Azure extractor baseline artifact exists in the active workspace. */

export type ExecutiveDashboardBaselineWarningBannerProps = {
  /** `setup` renders a neutral optional-setup card; `banner` keeps the legacy alert strip. */
  readonly variant?: "banner" | "setup";
};

export function ExecutiveDashboardBaselineWarningBanner({
  variant = "banner",
}: ExecutiveDashboardBaselineWarningBannerProps = {}) {
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
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <InlineGuidance label="Optional" labelTestId="inline-guidance-optional">
            upload a baseline inventory to improve ROI estimates.
          </InlineGuidance>
        </p>
        <p className="mt-2 mb-0">
          <Link
            href={EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF}
            className={OPERATOR_LINK.inline}
            data-testid="executive-baseline-upload-wizard-link"
          >
            Open baseline upload wizard
          </Link>
        </p>
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
          Executive ROI summaries stay grounded when you upload an Azure extractor inventory ZIP for this workspace.
          Use the baseline upload wizard to parse the packager output and start your first review from real inventory.
        </p>
        <p className="mt-2 mb-0">
          <Link
            href={EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF}
            className={OPERATOR_LINK.inline}
            data-testid="executive-baseline-upload-wizard-link"
          >
            Open baseline upload wizard
          </Link>
        </p>
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
