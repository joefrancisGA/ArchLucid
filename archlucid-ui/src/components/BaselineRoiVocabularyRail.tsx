"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildBaselineRoiVocabulary,
  resolveBaselineRoiPeerLink,
  type BaselineRoiSurfaceId,
  type BaselineRoiVocabularyModel,
} from "@/lib/vocabulary/baseline-roi-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type BaselineRoiVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: BaselineRoiSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildBaselineRoiVocabulary}. */
  readonly model?: BaselineRoiVocabularyModel;
};

/**
 * TB-2275 — Compact vocabulary rail between baseline settings and ROI summary.
 * Distinct from TB-2265 (scorecard ≠ ROI) and TB-2258 (ROI ≠ sponsor export).
 */
export function BaselineRoiVocabularyRail(
  props: BaselineRoiVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildBaselineRoiVocabulary();
  const peer = resolveBaselineRoiPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "baseline" ? model.baselineLink : model.roiSummaryLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="baseline-roi-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="baseline-roi-vocabulary-peer-link"
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
      aria-labelledby="baseline-roi-vocabulary-heading"
      data-testid="baseline-roi-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="baseline-roi-vocabulary-heading"
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
          data-testid="baseline-roi-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="baseline-roi-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
