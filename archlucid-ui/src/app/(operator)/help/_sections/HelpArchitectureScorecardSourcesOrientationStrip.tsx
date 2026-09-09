"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
  ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { ARCHITECTURE_SCORECARD_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/architecture-scorecard-help-page-copy";
import {
  helpArchitectureScorecardSourcesDisclosureHrefFromSearch,
  parseHelpArchitectureScorecardSourcesOpenFromSearch,
} from "@/lib/help/help-architecture-scorecard-sources-disclosure-url";

/** Sources-only follow-ups for `/help/architecture-scorecard` buyer-polished shell (HER). */
export function HelpArchitectureScorecardSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpArchitectureScorecardSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpArchitectureScorecardSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpArchitectureScorecardSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
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
    setSourcesOpenState(parseHelpArchitectureScorecardSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
      summaryLine={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
      sectionTestId={ARCHITECTURE_SCORECARD_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-architecture-scorecard-sources"
        headingId="related-evidence-and-sources"
        title={ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE}
        intro={ARCHITECTURE_SCORECARD_HELP_SOURCES_INTRO}
        links={ARCHITECTURE_SCORECARD_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
