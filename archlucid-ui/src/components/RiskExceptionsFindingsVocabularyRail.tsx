"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildRiskExceptionsFindingsVocabulary,
  resolveRiskExceptionsFindingsPeerLink,
  type RiskExceptionsFindingsSurfaceId,
  type RiskExceptionsFindingsVocabularyModel,
} from "@/lib/vocabulary/risk-exceptions-findings-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RiskExceptionsFindingsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current register and links to the peer. */
  readonly currentSurfaceId: RiskExceptionsFindingsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildRiskExceptionsFindingsVocabulary}. */
  readonly model?: RiskExceptionsFindingsVocabularyModel;
};

/**
 * TB-2249 — Compact vocabulary rail between risk exceptions and findings queue.
 * Mount on both hubs so operators do not conflate waivers with disposition.
 */
export function RiskExceptionsFindingsVocabularyRail(
  props: RiskExceptionsFindingsVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildRiskExceptionsFindingsVocabulary();
  const peer = resolveRiskExceptionsFindingsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "risk-exceptions"
      ? model.riskExceptionsLink
      : model.findingsLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="risk-exceptions-findings-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="risk-exceptions-findings-vocabulary-peer-link"
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
      aria-labelledby="risk-exceptions-findings-vocabulary-heading"
      data-testid="risk-exceptions-findings-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="risk-exceptions-findings-vocabulary-heading"
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
          data-testid="risk-exceptions-findings-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="risk-exceptions-findings-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
