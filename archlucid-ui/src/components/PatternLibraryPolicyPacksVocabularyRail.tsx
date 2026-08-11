"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildPatternLibraryPolicyPacksVocabulary,
  resolvePatternLibraryPolicyPacksPeerLink,
  type PatternLibraryPolicyPacksSurfaceId,
  type PatternLibraryPolicyPacksVocabularyModel,
} from "@/lib/vocabulary/pattern-library-policy-packs-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PatternLibraryPolicyPacksVocabularyRailProps = {
  readonly currentSurfaceId: PatternLibraryPolicyPacksSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PatternLibraryPolicyPacksVocabularyModel;
};

/** TB-2292 — Pattern library catalog vs enforceable Policy packs. */
export function PatternLibraryPolicyPacksVocabularyRail(
  props: PatternLibraryPolicyPacksVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildPatternLibraryPolicyPacksVocabulary();
  const peer = resolvePatternLibraryPolicyPacksPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "pattern-library"
      ? model.patternLibraryLink
      : model.policyPacksLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="pattern-library-policy-packs-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="pattern-library-policy-packs-vocabulary-peer-link"
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
      aria-labelledby="pattern-library-policy-packs-vocabulary-heading"
      data-testid="pattern-library-policy-packs-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="pattern-library-policy-packs-vocabulary-heading"
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
          data-testid="pattern-library-policy-packs-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="pattern-library-policy-packs-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
