"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildImpactPreviewCompareVocabulary,
  resolveImpactPreviewComparePeerLink,
  type ImpactPreviewCompareSurfaceId,
  type ImpactPreviewCompareVocabularyModel,
} from "@/lib/impact-preview-compare-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ImpactPreviewCompareVocabularyRailProps = {
  /** Surface hosting the strip — marks the current insight job and links to the peer. */
  readonly currentSurfaceId: ImpactPreviewCompareSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildImpactPreviewCompareVocabulary}. */
  readonly model?: ImpactPreviewCompareVocabularyModel;
};

/**
 * TB-2250 — Compact vocabulary rail between Impact preview and Compare two reviews.
 * Mount on both hubs so operators do not conflate change simulation with pairwise diff.
 * Distinct from ValidateCompareVocabularyRail (TB-2240).
 */
export function ImpactPreviewCompareVocabularyRail(
  props: ImpactPreviewCompareVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildImpactPreviewCompareVocabulary();
  const peer = resolveImpactPreviewComparePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "impact-preview"
      ? model.impactPreviewLink
      : model.compareLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="impact-preview-compare-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="impact-preview-compare-vocabulary-peer-link"
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
      aria-labelledby="impact-preview-compare-vocabulary-heading"
      data-testid="impact-preview-compare-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="impact-preview-compare-vocabulary-heading"
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
          data-testid="impact-preview-compare-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="impact-preview-compare-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
