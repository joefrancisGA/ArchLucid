"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildDigestsBrowseScheduleSubscriptionsVocabulary,
  resolveDigestsBrowseScheduleSubscriptionsLink,
  resolveDigestsBrowseScheduleSubscriptionsPeerLinks,
  type DigestsBrowseScheduleSubscriptionsSurfaceId,
  type DigestsBrowseScheduleSubscriptionsVocabularyModel,
} from "@/lib/vocabulary/digests-browse-schedule-subscriptions-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DigestsBrowseScheduleSubscriptionsVocabularyRailProps = {
  /** Digests hub tab hosting the strip — marks the current job and links to peers. */
  readonly currentSurfaceId: DigestsBrowseScheduleSubscriptionsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-three explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildDigestsBrowseScheduleSubscriptionsVocabulary}. */
  readonly model?: DigestsBrowseScheduleSubscriptionsVocabularyModel;
};

/**
 * TB-2290 — Triad vocabulary strip for Digests Browse, Schedule, and Subscriptions tabs.
 * Mount on DigestsHubClient with the active tab as currentSurfaceId.
 */
export function DigestsBrowseScheduleSubscriptionsVocabularyRail(
  props: DigestsBrowseScheduleSubscriptionsVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildDigestsBrowseScheduleSubscriptionsVocabulary();
  const peers = resolveDigestsBrowseScheduleSubscriptionsPeerLinks(props.currentSurfaceId);
  const currentLink = resolveDigestsBrowseScheduleSubscriptionsLink(props.currentSurfaceId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="digests-browse-schedule-subscriptions-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        {peers.map((peer, index) => (
          <span key={peer.id}>
            {index > 0 ? " · " : null}
            <Link
              href={peer.href}
              className={cn(OPERATOR_LINK.nav, "font-medium")}
              data-testid={`digests-browse-schedule-subscriptions-vocabulary-peer-${peer.id}`}
            >
              {peer.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="digests-browse-schedule-subscriptions-vocabulary-heading"
      data-testid="digests-browse-schedule-subscriptions-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="digests-browse-schedule-subscriptions-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {currentLink !== null ? (
          <span
            className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="digests-browse-schedule-subscriptions-vocabulary-current"
            aria-current="page"
          >
            {currentLink.label}
          </span>
        ) : null}
        {peers.map((peer) => (
          <Link
            key={peer.id}
            href={peer.href}
            className={OPERATOR_LINK.optional}
            data-testid={`digests-browse-schedule-subscriptions-vocabulary-peer-${peer.id}`}
          >
            {peer.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
