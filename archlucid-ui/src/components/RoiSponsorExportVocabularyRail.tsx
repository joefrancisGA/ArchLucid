"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildRoiSponsorExportHandoffHref,
  buildRoiSponsorExportVocabulary,
  resolveRoiSponsorExportPeerLink,
  type RoiSponsorExportSurfaceId,
  type RoiSponsorExportVocabularyModel,
} from "@/lib/roi-sponsor-export-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RoiSponsorExportVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: RoiSponsorExportSurfaceId;
  /** When mounted on review detail, scopes the sponsor-handoff peer (or current) href. */
  readonly runId?: string | null;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildRoiSponsorExportVocabulary}. */
  readonly model?: RoiSponsorExportVocabularyModel;
};

/**
 * TB-2258 — Compact vocabulary rail between ROI summary (portfolio KPI) and sponsor export (per-package send).
 * Mount on ROI summary, review sponsor handoff, and optionally executive dashboard exports.
 */
export function RoiSponsorExportVocabularyRail(
  props: RoiSponsorExportVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildRoiSponsorExportVocabulary();
  const peer = resolveRoiSponsorExportPeerLink(props.currentSurfaceId);
  const peerHref =
    peer.id === "sponsor-handoff"
      ? buildRoiSponsorExportHandoffHref(props.runId)
      : peer.href;
  const currentLabel =
    props.currentSurfaceId === "roi-summary"
      ? model.roiSummaryLink.label
      : props.currentSurfaceId === "executive-dashboard"
        ? model.executiveDashboardLink.label
        : model.sponsorHandoffLink.label;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="roi-sponsor-export-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peerHref}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="roi-sponsor-export-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="roi-sponsor-export-vocabulary-heading"
      data-testid="roi-sponsor-export-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="roi-sponsor-export-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="roi-sponsor-export-vocabulary-current"
          aria-current="page"
        >
          {currentLabel}
        </span>
        <Link
          href={peerHref}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="roi-sponsor-export-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
