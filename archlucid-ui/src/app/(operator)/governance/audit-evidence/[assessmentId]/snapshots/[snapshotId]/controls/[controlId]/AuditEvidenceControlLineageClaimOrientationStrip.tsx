"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_SOURCES_INTRO,
  auditEvidenceSourcesForProductLine,
} from "@/lib/audit-evidence-evidence-copy";

/** Claim discipline + Sources index for audit control lineage detail (GOO). */
export function AuditEvidenceControlLineageClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();
  const sources = auditEvidenceSourcesForProductLine(productLine);

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-evidence-control-lineage"
      sourcesIntro={AUDIT_EVIDENCE_CONTROL_LINEAGE_SOURCES_INTRO}
      sources={sources}
    />
  );
}
