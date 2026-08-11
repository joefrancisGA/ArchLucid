"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildDigestRecurrenceScheduleVocabulary,
  resolveDigestRecurrenceSchedulePeerLink,
  type DigestRecurrenceScheduleSurfaceId,
  type DigestRecurrenceScheduleVocabularyModel,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DigestRecurrenceScheduleVocabularyRailProps = {
  /** Surface hosting the strip — marks the current schedule kind and links to the peer. */
  readonly currentSurfaceId: DigestRecurrenceScheduleSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildDigestRecurrenceScheduleVocabulary}. */
  readonly model?: DigestRecurrenceScheduleVocabularyModel;
};

/**
 * TB-2226 — Compact vocabulary rail between executive digest schedule and recurrence schedules.
 * Mount on both hubs so operators do not conflate email cadence with re-review automation.
 */
export function DigestRecurrenceScheduleVocabularyRail(
  props: DigestRecurrenceScheduleVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildDigestRecurrenceScheduleVocabulary();
  const peer = resolveDigestRecurrenceSchedulePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "digest-executive-schedule"
      ? model.digestLink
      : model.recurrenceLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="digest-recurrence-schedule-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="digest-recurrence-schedule-vocabulary-peer-link"
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
      aria-labelledby="digest-recurrence-schedule-vocabulary-heading"
      data-testid="digest-recurrence-schedule-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="digest-recurrence-schedule-vocabulary-heading"
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
          data-testid="digest-recurrence-schedule-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digest-recurrence-schedule-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
