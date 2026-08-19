import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PLANNING_PLAN_DETAIL_CLAIM_DISCIPLINE,
  PLANNING_PLAN_DETAIL_CLAIM_HEADING,
  PLANNING_PLAN_DETAIL_SOURCES,
  PLANNING_PLAN_DETAIL_SOURCES_INTRO,
} from "@/lib/planning-plan-detail-evidence-copy";

/** Claim discipline + Sources index for improvement plan detail (INL). */
export function PlanningPlanDetailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="planning-plan-detail"
      claim={PLANNING_PLAN_DETAIL_CLAIM_DISCIPLINE}
      claimHeading={PLANNING_PLAN_DETAIL_CLAIM_HEADING}
      sourcesIntro={PLANNING_PLAN_DETAIL_SOURCES_INTRO}
      sources={PLANNING_PLAN_DETAIL_SOURCES}
    />
  );
}
