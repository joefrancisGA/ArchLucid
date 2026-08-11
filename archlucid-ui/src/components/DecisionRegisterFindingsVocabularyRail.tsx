"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildDecisionRegisterFindingsVocabulary,
  resolveDecisionRegisterFindingsPeerLink,
  type DecisionRegisterFindingsSurfaceId,
  type DecisionRegisterFindingsVocabularyModel,
} from "@/lib/vocabulary/decision-register-findings-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DecisionRegisterFindingsVocabularyRailProps = {
  readonly currentSurfaceId: DecisionRegisterFindingsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: DecisionRegisterFindingsVocabularyModel;
};

/**
 * TB-2291 — Compact vocabulary rail between Decision register and Findings queue.
 * Always-on peer rail (distinct from empty-state teaching TB-2263).
 */
export function DecisionRegisterFindingsVocabularyRail(
  props: DecisionRegisterFindingsVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildDecisionRegisterFindingsVocabulary();
  const peer = resolveDecisionRegisterFindingsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "decision-register"
      ? model.decisionRegisterLink
      : model.findingsQueueLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="decision-register-findings-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="decision-register-findings-vocabulary-peer-link"
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
      aria-labelledby="decision-register-findings-vocabulary-heading"
      data-testid="decision-register-findings-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="decision-register-findings-vocabulary-heading"
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
          data-testid="decision-register-findings-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="decision-register-findings-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
