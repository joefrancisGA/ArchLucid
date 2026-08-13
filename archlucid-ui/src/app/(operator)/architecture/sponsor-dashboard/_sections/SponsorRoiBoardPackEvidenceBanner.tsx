"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { SPONSOR_ROI_PROOF_STATUS_HELP_HREF } from "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiProofStatusStrip";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  boardPackClusterPostureLabel,
  buildBoardPackEvidenceClusterRows,
  type BoardPackClusterEvidencePosture,
} from "@/lib/sponsor-roi-board-pack-evidence-clusters";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";

export type SponsorRoiBoardPackEvidenceBannerProps = {
  readonly summary: SponsorRoiSummary;
  readonly includeNarrative: boolean;
};

function postureStatusKind(posture: BoardPackClusterEvidencePosture): "ready" | "needs-attention" | "neutral" {
  if (posture === "extractor-backed") {
    return "ready";
  }

  if (posture === "illustrative") {
    return "needs-attention";
  }

  return "neutral";
}

/**
 * Surfaces illustrative vs extractor-backed posture per finding cluster before board-pack export.
 */
export function SponsorRoiBoardPackEvidenceBanner(
  props: SponsorRoiBoardPackEvidenceBannerProps,
): ReactElement {
  const clusterRows = buildBoardPackEvidenceClusterRows(props.summary);
  const illustrativeCount = clusterRows.filter((row) => row.posture === "illustrative").length;
  const extractorCount = clusterRows.filter((row) => row.posture === "extractor-backed").length;

  return (
    <aside
      aria-labelledby="exec-roi-board-pack-evidence-heading"
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="exec-roi-board-pack-evidence-banner"
    >
      <h4
        id="exec-roi-board-pack-evidence-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Board pack evidence posture
      </h4>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Before you share the board pack: {extractorCount} cluster(s) are extractor-backed, {illustrativeCount} are
        illustrative for cost lines.
        {props.includeNarrative
          ? " The optional AI narrative is advisory and not part of the governed review."
          : ""}
      </p>

      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {clusterRows.map((row) => (
          <li
            key={`${row.clusterLabel}-${row.posture}`}
            className="rounded-md border border-neutral-200 bg-white/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40"
            data-testid="exec-roi-board-pack-evidence-cluster"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {row.clusterLabel}
              </span>
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                ({row.findingCount} finding{row.findingCount === 1 ? "" : "s"})
              </span>
              <StatusTag
                kind={postureStatusKind(row.posture)}
                label={boardPackClusterPostureLabel(row.posture)}
                data-testid={`exec-roi-board-pack-posture-${row.posture}`}
              />
            </div>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.detail}</p>
          </li>
        ))}
      </ul>

      <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        See{" "}
        <Link href={SPONSOR_ROI_PROOF_STATUS_HELP_HREF} className={OPERATOR_LINK.inline}>
          ROI methodology
        </Link>{" "}
        for disposition-aware headline scope and non-summing per-system rows.
      </p>
    </aside>
  );
}
