import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";

import {
  RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_SOURCES,
  RECURRENCE_SCHEDULES_SOURCES_INTRO,
} from "@/lib/recurrence-schedules-evidence-copy";

/** Sources index for the recurrence schedules governance hub (GRX). */
export function RecurrenceSchedulesClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="recurrence-schedules"
      sourcesTitle={RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE}
      sourcesIntro={RECURRENCE_SCHEDULES_SOURCES_INTRO}
      sources={RECURRENCE_SCHEDULES_SOURCES}
      hubSecondary
    />
  );
}
