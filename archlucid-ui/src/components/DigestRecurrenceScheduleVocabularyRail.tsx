"use client";

import type { JSX } from "react";

import {
  buildDigestRecurrenceScheduleVocabulary,
  resolveDigestRecurrenceSchedulePeerLink,
  type DigestRecurrenceScheduleSurfaceId,
  type DigestRecurrenceScheduleVocabularyModel,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
 * TB-2226 — Compact vocabulary rail between sponsor digest schedule and recurrence schedules.
 * Mount on both hubs so operators do not conflate email cadence with re-review automation.
 */
export function DigestRecurrenceScheduleVocabularyRail(
  props: DigestRecurrenceScheduleVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildDigestRecurrenceScheduleVocabulary();
  const peer = resolveDigestRecurrenceSchedulePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "digest-sponsor-schedule"
      ? model.digestLink
      : model.recurrenceLink;

  return (
    <VocabularyRail
      testIdPrefix="digest-recurrence-schedule-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
