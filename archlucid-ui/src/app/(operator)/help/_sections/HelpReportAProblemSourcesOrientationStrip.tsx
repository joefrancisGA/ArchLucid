"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpReportAProblemSourcesDisclosureHrefFromSearch,
  parseHelpReportAProblemSourcesOpenFromSearch,
} from "@/lib/help/help-report-a-problem-sources-disclosure-url";
import {
  REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE,
  REPORT_A_PROBLEM_HELP_SOURCES,
  REPORT_A_PROBLEM_HELP_SOURCES_INTRO,
} from "@/lib/report-a-problem-help-evidence-copy";
import { REPORT_A_PROBLEM_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/report-a-problem-help-page-copy";

/** Sources-only follow-ups for `/help/report-a-problem` buyer-polished shell (HRE). */
export function HelpReportAProblemSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpReportAProblemSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpReportAProblemSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpReportAProblemSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpReportAProblemSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE}
      summaryLine={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
      sectionTestId={REPORT_A_PROBLEM_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-report-a-problem-sources"
        headingId="where-to-go-next"
        title={REPORT_A_PROBLEM_HELP_FOLLOW_UPS_TITLE}
        intro={REPORT_A_PROBLEM_HELP_SOURCES_INTRO}
        links={REPORT_A_PROBLEM_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
