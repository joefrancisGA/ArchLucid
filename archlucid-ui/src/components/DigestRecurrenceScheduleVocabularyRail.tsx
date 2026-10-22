"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildDigestRecurrenceSchedulePairwiseRail,
  type DigestRecurrenceScheduleSurfaceId,
  type DigestRecurrenceScheduleVocabularyModel,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.digestLink,
          peerLink: props.model.recurrenceLink,
        }
      : buildDigestRecurrenceSchedulePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="digest-recurrence-schedule-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
