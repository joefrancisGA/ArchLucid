"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildPolicyPackDetailHubVocabulary,
  resolvePolicyPackDetailHubPeerLink,
  type PolicyPackDetailHubSurfaceId,
  type PolicyPackDetailHubVocabularyModel,
} from "@/lib/vocabulary/policy-pack-detail-hub-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PolicyPackDetailHubVocabularyRailProps = {
  /** Surface hosting the strip — marks packs hub vs pack detail and links to the peer. */
  readonly currentSurfaceId: PolicyPackDetailHubSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildPolicyPackDetailHubVocabulary}. */
  readonly model?: PolicyPackDetailHubVocabularyModel;
};

/**
 * TB-2283 — Compact vocabulary rail between Policy packs hub and Pack detail.
 * Mount on both surfaces so operators do not conflate the library with one pack.
 * Distinct from Policy packs ≠ Standards (TB-2239).
 */
export function PolicyPackDetailHubVocabularyRail(
  props: PolicyPackDetailHubVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildPolicyPackDetailHubVocabulary();
  const peer = resolvePolicyPackDetailHubPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "policy-packs" ? model.packsHubLink : model.packDetailLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="policy-pack-detail-hub-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="policy-pack-detail-hub-vocabulary-peer-link"
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
      aria-labelledby="policy-pack-detail-hub-vocabulary-heading"
      data-testid="policy-pack-detail-hub-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="policy-pack-detail-hub-vocabulary-heading"
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
          data-testid="policy-pack-detail-hub-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="policy-pack-detail-hub-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
