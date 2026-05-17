"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

/** Session-dismiss key — discarded when the browser tab ends. */

const EXECUTIVE_DASHBOARD_BASELINE_WARNING_DISMISSED_SESSION_KEY: string =
  "archlucid-dashboard-baseline-upload-warning-dismissed";

/** GitHub-rendered baseline / Azure extractor ZIP upload operator runbook. */

export const EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_DOC_HREF = `${DEFAULT_GITHUB_BLOB_BASE}/docs/runbooks/AZURE_EXTRACTOR_INGEST.md`;

/** Prominent nudge when tenant ROI baseline anchors are not captured yet (Executive summary route). */

export function ExecutiveDashboardBaselineWarningBanner() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const { loading: baselineLoading, complete } = usePilotRoiBaselineCompleteness();
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

  // `complete === false`: anchors missing; `null` / `true` hides the banner (unknown or already captured).

  if (sessionDismissed || !operatorOrAdminTier || baselineLoading || complete !== false) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-start sm:justify-between dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
      role="alert"
      data-testid="executive-baseline-upload-warning-banner"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-semibold">Establish tenant baseline inputs</p>
        <p className="mt-2 mb-0 text-amber-900/95 dark:text-amber-100/90">
          Executive ROI summaries stay grounded when you capture baseline evidence — typically an Azure extractor
          inventory ZIP from your checkout (see docs) plus{" "}
          <Link href="/settings/baseline" className="font-medium underline underline-offset-2">
            ROI baseline settings
          </Link>
          .
        </p>
        <p className="mt-2 mb-0">
          <a
            href={EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_DOC_HREF}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium underline underline-offset-2"
          >
            Baseline ZIP upload documentation (opens in new tab)
          </a>
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
