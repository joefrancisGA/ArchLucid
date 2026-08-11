"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildClarificationsFindingsVocabulary,
  resolveClarificationsFindingsPeerLink,
  type ClarificationsFindingsSurfaceId,
  type ClarificationsFindingsVocabularyModel,
} from "@/lib/vocabulary/clarifications-findings-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ClarificationsFindingsVocabularyRailProps = {
  readonly runId: string;
  readonly currentSurfaceId: ClarificationsFindingsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ClarificationsFindingsVocabularyModel;
};

/** TB-2298 — Create-home Clarifications gaps vs Findings triage. */
export function ClarificationsFindingsVocabularyRail(
  props: ClarificationsFindingsVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildClarificationsFindingsVocabulary(props.runId);
  const peer = resolveClarificationsFindingsPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "clarifications"
      ? model.clarificationsLink
      : model.findingsLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="clarifications-findings-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="clarifications-findings-vocabulary-peer-link"
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
      aria-labelledby="clarifications-findings-vocabulary-heading"
      data-testid="clarifications-findings-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="clarifications-findings-vocabulary-heading"
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
          data-testid="clarifications-findings-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="clarifications-findings-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
