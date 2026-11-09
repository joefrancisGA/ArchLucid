import { ProcurementEvidenceMapSection } from "@/components/procurement/ProcurementEvidenceMapSection";
import {
  ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS,
  PROCUREMENT_EVIDENCE_MAP_HEADING,
} from "@/lib/procurement/procurement-evidence-map-copy";

const REVIEW_PACKAGE_PROCUREMENT_LEAD =
  "Under the first-review spine — what procurement reviewers can open in-product versus what is not published. Not a CPA attestation." as const;

/** Compact procurement honesty on the review-package stamp viewport (below the spine). */
export function ArchLucidReviewPackageProcurementHonestySection(): React.JSX.Element {
  return (
    <ProcurementEvidenceMapSection
      rows={ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS}
      heading={PROCUREMENT_EVIDENCE_MAP_HEADING}
      lead={REVIEW_PACKAGE_PROCUREMENT_LEAD}
      testId="run-detail-review-package-procurement-evidence"
    />
  );
}
