import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PLANNING_SOURCES,
  PLANNING_SOURCES_INTRO,
} from "@/lib/planning-evidence-copy";

/** Claim discipline + Sources index for improvement planning (PLA). */
export function PlanningClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="improvement-planning"
      sourcesIntro={PLANNING_SOURCES_INTRO}
      sources={PLANNING_SOURCES}
    />
  );
}
