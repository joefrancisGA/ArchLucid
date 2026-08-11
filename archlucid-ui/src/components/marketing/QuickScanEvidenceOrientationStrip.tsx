import { EvidenceOrientationSourcesAndClaimStrip } from "@/components/evidence-orientation/EvidenceOrientationSourcesAndClaimStrip";
import {
  QUICK_SCAN_CLAIM_DISCIPLINE,
  QUICK_SCAN_SOURCES,
  QUICK_SCAN_SOURCES_INTRO,
} from "@/lib/quick-scan-evidence-copy";

/** Evaluation Sources + claim discipline for `/quick-scan` (QXX Evidence). */
export function QuickScanEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationSourcesAndClaimStrip
      slug="quick-scan"
      align="text-left"
      sourcesIntro={QUICK_SCAN_SOURCES_INTRO}
      sources={QUICK_SCAN_SOURCES}
      claimHeading="Demo scan only"
      claim={QUICK_SCAN_CLAIM_DISCIPLINE}
    />
  );
}
