import type { ReactElement } from "react";

import {
  resolveSponsorArtifactEvidenceBadges,
  type ResolveSponsorArtifactEvidenceBadgeInput,
} from "@/lib/sponsor-artifact-evidence-badge";

export type SponsorArtifactEvidenceBadgeProps = ResolveSponsorArtifactEvidenceBadgeInput;

function badgeClass(warn: boolean): string {
  if (warn)
    return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";

  return "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100";
}

/** Compact sponsor-facing source and freshness badges for review exports and ROI surfaces. */
export function SponsorArtifactEvidenceBadge(props: SponsorArtifactEvidenceBadgeProps): ReactElement {
  const badges = resolveSponsorArtifactEvidenceBadges(props);
  const sharedClass = `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass(badges.warnBeforeSponsorSend)}`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2" data-testid="sponsor-artifact-evidence-badges">
      <span data-testid="sponsor-evidence-source-badge" className={sharedClass}>
        Source: {badges.sourceLabel}
      </span>
      <span data-testid="sponsor-evidence-freshness-badge" className={sharedClass}>
        Freshness: {badges.freshnessLabel}
      </span>
      {badges.warnBeforeSponsorSend ? (
        <span
          data-testid="sponsor-evidence-send-warning"
          className="text-[11px] font-medium text-amber-900 dark:text-amber-100"
        >
          Review before external sponsor send — stale, missing, demo-derived, or heuristic evidence must not read as current.
        </span>
      ) : null}
    </span>
  );
}
