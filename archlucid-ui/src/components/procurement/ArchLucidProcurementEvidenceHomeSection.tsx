"use client";

import { ProcurementEvidenceMapSection } from "@/components/procurement/ProcurementEvidenceMapSection";
import { ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS } from "@/lib/procurement/procurement-evidence-map-copy";

/** Architecture first-review and infrastructure surfaces — procurement honesty map. */
export function ArchLucidProcurementEvidenceHomeSection(): React.JSX.Element {
  return (
    <ProcurementEvidenceMapSection
      rows={ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS}
      testId="archlucid-procurement-evidence-map"
    />
  );
}
