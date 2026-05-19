"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { useWorkspaceBaselineArtifactsPresence } from "@/hooks/use-workspace-baseline-artifacts";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

/** Session-dismiss key — discarded when the browser tab ends. */

const EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY: string =
  "archlucid-dashboard-baseline-upload-warning-dismissed";

/** Baseline-first new-run wizard (`?baseline=1`) — Azure extractor ZIP upload before identity. */

export const EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF = "/reviews/new?baseline=1";

/** Prominent nudge when no Azure extractor baseline artifact exists in the active workspace. */

export function ExecutiveDashboardBaselineWarningBanner() {
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

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
      role="alert"
      data-testid="executive-baseline-upload-warning-banner"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-semibold">Upload workspace baseline inventory</p>
        <p className="mt-2 mb-0 text-amber-900/95 dark:text-amber-100/90">
          Executive ROI summaries stay grounded when you upload an Azure extractor inventory ZIP for this workspace.
          Use the baseline upload wizard to parse the packager output and start your first review from real inventory.
        </p>
        <p className="mt-2 mb-0">
          <Link
            href={EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF}
            className="font-medium underline underline-offset-2"
            data-testid="executive-baseline-upload-wizard-link"
          >
            Open baseline upload wizard
          </Link>
        </p>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label="Dismiss baseline reminder for this session"
        data-testid="executive-baseline-upload-warning-dismiss"
        className="shrink-0 self-end border-amber-400 bg-white text-amber-950 hover:bg-amber-100 sm:self-start dark:border-amber-700 dark:bg-transparent dark:text-amber-50 dark:hover:bg-amber-900/60"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY, "1");
          }

          setSessionDismissed(true);
        }}
      >
        Dismiss
      </Button>
    </div>
  );
}
