import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_EVIDENCE_SOURCES,
  AUDIT_EVIDENCE_SOURCES_INTRO,
} from "@/lib/audit-evidence-evidence-copy";

/** Claim discipline + Sources index for audit evidence lookup (GOU). */
export function AuditEvidenceClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-evidence-lineage"
      sourcesIntro={AUDIT_EVIDENCE_SOURCES_INTRO}
      sources={AUDIT_EVIDENCE_SOURCES}
    />
  );
}
