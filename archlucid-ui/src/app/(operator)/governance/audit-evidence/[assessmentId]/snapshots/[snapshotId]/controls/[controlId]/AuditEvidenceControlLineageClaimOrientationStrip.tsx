import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SOURCES_INTRO,
  AUDIT_EVIDENCE_SOURCES,
} from "@/lib/audit-evidence-evidence-copy";

/** Claim discipline + Sources index for audit control lineage detail (GOO). */
export function AuditEvidenceControlLineageClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-evidence-control-lineage"
      sourcesIntro={AUDIT_EVIDENCE_CONTROL_LINEAGE_SOURCES_INTRO}
      sources={AUDIT_EVIDENCE_SOURCES}
    />
  );
}
