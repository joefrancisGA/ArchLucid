import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PLANNING_PLAN_DETAIL_SOURCES,
  PLANNING_PLAN_DETAIL_SOURCES_INTRO,
} from "@/lib/planning-plan-detail-evidence-copy";

/** Claim discipline + Sources index for improvement plan detail (INL). */
export function PlanningPlanDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="planning-plan-detail"
      sourcesIntro={PLANNING_PLAN_DETAIL_SOURCES_INTRO}
      sources={PLANNING_PLAN_DETAIL_SOURCES}
    />
  );
}
