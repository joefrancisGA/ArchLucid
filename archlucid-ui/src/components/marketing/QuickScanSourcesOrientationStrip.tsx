import { QUICK_SCAN_ORIENTATION_BOTTOM_TEST_ID } from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  QUICK_SCAN_FOLLOW_UPS_TITLE,
  QUICK_SCAN_ORIENTATION_SOURCES_INTRO,
  QUICK_SCAN_SOURCES,
} from "@/lib/quick-scan-evidence-copy";

/** Sources-only follow-ups for `/quick-scan` buyer-polished shell (QXX). */
export function QuickScanSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="quick-scan"
      stripTestId={QUICK_SCAN_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="quick-scan-sources"
      sourcesTitle={QUICK_SCAN_FOLLOW_UPS_TITLE}
      sourcesIntro={QUICK_SCAN_ORIENTATION_SOURCES_INTRO}
      sources={QUICK_SCAN_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
