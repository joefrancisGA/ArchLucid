"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { QUICK_SCAN_ORIENTATION_BOTTOM_TEST_ID } from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  quickScanSourcesDisclosureHrefFromSearch,
  parseQuickScanSourcesOpenFromSearch,
} from "@/lib/marketing/quick-scan-sources-disclosure-url";
import {
  QUICK_SCAN_FOLLOW_UPS_TITLE,
  QUICK_SCAN_ORIENTATION_SOURCES_INTRO,
  QUICK_SCAN_SOURCES,
} from "@/lib/quick-scan-evidence-copy";

/** Sources-only follow-ups for `/quick-scan` buyer-polished shell (QXX). */
export function QuickScanSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("quickScanSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() => parseQuickScanSourcesOpenFromSearch(sourcesOpenParam));

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(quickScanSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);
    },
    [syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(parseQuickScanSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={QUICK_SCAN_FOLLOW_UPS_TITLE}
      summaryLine={QUICK_SCAN_ORIENTATION_SOURCES_INTRO}
      sectionTestId={QUICK_SCAN_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="quick-scan-sources"
        headingId="where-to-go-next"
        title={QUICK_SCAN_FOLLOW_UPS_TITLE}
        intro={QUICK_SCAN_ORIENTATION_SOURCES_INTRO}
        links={QUICK_SCAN_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
