"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildRunProvenanceEvidenceGraphVocabulary,
  resolveRunProvenanceEvidenceGraphPeerLink,
  type RunProvenanceEvidenceGraphSurfaceId,
  type RunProvenanceEvidenceGraphVocabularyModel,
} from "@/lib/vocabulary/run-provenance-evidence-graph-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunProvenanceEvidenceGraphVocabularyRailProps = {
  readonly currentSurfaceId: RunProvenanceEvidenceGraphSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: RunProvenanceEvidenceGraphVocabularyModel;
};

/** TB-2296 — Per-package provenance walk vs cross-package Evidence graph. */
export function RunProvenanceEvidenceGraphVocabularyRail(
  props: RunProvenanceEvidenceGraphVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildRunProvenanceEvidenceGraphVocabulary();
  const peer = resolveRunProvenanceEvidenceGraphPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "run-provenance"
      ? model.runProvenanceLink
      : model.evidenceGraphLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="run-provenance-evidence-graph-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="run-provenance-evidence-graph-vocabulary-peer-link"
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
      aria-labelledby="run-provenance-evidence-graph-vocabulary-heading"
      data-testid="run-provenance-evidence-graph-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="run-provenance-evidence-graph-vocabulary-heading"
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
          data-testid="run-provenance-evidence-graph-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-provenance-evidence-graph-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
