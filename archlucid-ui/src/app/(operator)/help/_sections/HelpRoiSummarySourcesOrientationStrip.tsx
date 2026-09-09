"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpRoiSummarySourcesDisclosureHrefFromSearch,
  parseHelpRoiSummarySourcesOpenFromSearch,
} from "@/lib/help/help-roi-summary-sources-disclosure-url";
import {
  ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE,
  ROI_SUMMARY_HELP_SOURCES,
  ROI_SUMMARY_HELP_SOURCES_INTRO,
} from "@/lib/roi-summary-help-evidence-copy";
import { ROI_SUMMARY_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/roi-summary-help-page-copy";

/** Sources-only follow-ups for `/help/roi-summary` buyer-polished shell (HRO). */
export function HelpRoiSummarySourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpRoiSummarySourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpRoiSummarySourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpRoiSummarySourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpRoiSummarySourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
      summaryLine={ROI_SUMMARY_HELP_SOURCES_INTRO}
      sectionTestId={ROI_SUMMARY_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-roi-summary-sources"
        headingId="where-to-go-next"
        title={ROI_SUMMARY_HELP_FOLLOW_UPS_TITLE}
        intro={ROI_SUMMARY_HELP_SOURCES_INTRO}
        links={ROI_SUMMARY_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
