import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES_INTRO,
} from "@/lib/governance/governance-infrastructure-evidence-copy";

/** Claim discipline + Sources index for diagram reconciliation (GDI). */
export function DiagramReconcileClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-infrastructure-diagram-reconcile"
      sourcesIntro={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES_INTRO}
      sources={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCES}
    />
  );
}
