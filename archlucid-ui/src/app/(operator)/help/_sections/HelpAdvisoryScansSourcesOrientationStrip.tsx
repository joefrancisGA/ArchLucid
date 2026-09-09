"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE,
  ADVISORY_SCANS_HELP_SOURCES,
  ADVISORY_SCANS_HELP_SOURCES_INTRO,
} from "@/lib/advisory-scans-help-evidence-copy";
import { ADVISORY_SCANS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/advisory-scans-help-page-copy";
import {
  helpAdvisoryScansSourcesDisclosureHrefFromSearch,
  parseHelpAdvisoryScansSourcesOpenFromSearch,
} from "@/lib/help/help-advisory-scans-sources-disclosure-url";

/** Sources-only follow-ups for `/help/advisory-scans` buyer-polished shell (HAD). */
export function HelpAdvisoryScansSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpAdvisoryScansSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAdvisoryScansSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAdvisoryScansSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAdvisoryScansSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={ADVISORY_SCANS_HELP_SOURCES_INTRO}
      sectionTestId={ADVISORY_SCANS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-advisory-scans-sources"
        headingId="where-to-go-next"
        title={ADVISORY_SCANS_HELP_FOLLOW_UPS_TITLE}
        intro={ADVISORY_SCANS_HELP_SOURCES_INTRO}
        links={ADVISORY_SCANS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
