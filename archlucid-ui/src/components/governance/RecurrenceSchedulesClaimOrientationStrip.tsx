"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_SOURCES_INTRO,
  resolveRecurrenceSchedulesOrientationSources,
} from "@/lib/recurrence-schedules-evidence-copy";

/** Sources index for the recurrence schedules governance hub (GRX). */
export function RecurrenceSchedulesClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="recurrence-schedules"
      sourcesTitle={RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE}
      sourcesIntro={RECURRENCE_SCHEDULES_SOURCES_INTRO}
      sources={resolveRecurrenceSchedulesOrientationSources(productLine)}
      hubSecondary
    />
  );
}
