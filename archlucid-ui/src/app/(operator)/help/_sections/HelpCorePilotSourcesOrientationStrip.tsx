"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  CORE_PILOT_HELP_FOLLOW_UPS_TITLE,
  CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";
import { CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/core-pilot-help-page-copy";
import {
  helpCorePilotSourcesDisclosureHrefFromSearch,
  parseHelpCorePilotSourcesOpenFromSearch,
} from "@/lib/help/help-core-pilot-sources-disclosure-url";

/** Sources-only follow-ups for `/help/first-architecture-review` buyer-polished shell (COR). */
export function HelpCorePilotSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpCorePilotSourcesOpenParam = searchParams.get("helpCorePilotSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpCorePilotSourcesOpenFromSearch(helpCorePilotSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpCorePilotSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpCorePilotSourcesOpenFromSearch(helpCorePilotSourcesOpenParam));
  }, [helpCorePilotSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={CORE_PILOT_HELP_FOLLOW_UPS_TITLE}
      summaryLine={CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={CORE_PILOT_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="core-pilot-help-sources"
        headingId="where-to-go-next"
        title={CORE_PILOT_HELP_FOLLOW_UPS_TITLE}
        intro={CORE_PILOT_HELP_ORIENTATION_SOURCES_INTRO}
        links={CORE_PILOT_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
