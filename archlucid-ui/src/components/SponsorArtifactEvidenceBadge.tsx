import type { ReactElement } from "react";

import {
  resolveSponsorArtifactEvidenceBadges,
  type ResolveSponsorArtifactEvidenceBadgeInput,
} from "@/lib/sponsor-artifact-evidence-badge";
import { resolveSponsorArtifactTrustPostures } from "@/lib/sponsor-artifact-trust-posture";

export type SponsorArtifactEvidenceBadgeProps = ResolveSponsorArtifactEvidenceBadgeInput;

function badgeClass(warn: boolean): string {
  if (warn)
    return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";

  return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-600";
}

/** Compact sponsor-facing source and freshness badges for review exports and ROI surfaces. */
function trustPostureClass(posture: string): string {
  if (posture === "evidence-backed") {
    return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-600";
  }

  if (posture === "deferred") {
    return "border-neutral-300 bg-al-surface-raised text-al-text-primary dark:border-neutral-700";
  }

  return "border-amber-600/40 bg-al-surface-raised text-al-text-primary dark:border-amber-700/50";
}

export function SponsorArtifactEvidenceBadge(props: SponsorArtifactEvidenceBadgeProps): ReactElement {
  const badges = resolveSponsorArtifactEvidenceBadges(props);
  const trustPostures = resolveSponsorArtifactTrustPostures(props);
  const sharedClass = `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass(badges.warnBeforeSponsorSend)}`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2" data-testid="sponsor-artifact-evidence-badges">
      {trustPostures.map((trust) => (
        <span
          key={trust.posture}
          data-testid={`sponsor-trust-posture-${trust.posture}`}
          title={trust.detail}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${trustPostureClass(trust.posture)}`}
        >
          {trust.display}
        </span>
      ))}
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
