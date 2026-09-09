"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpSystemHealthSourcesDisclosureHrefFromSearch,
  parseHelpSystemHealthSourcesOpenFromSearch,
} from "@/lib/help/help-system-health-sources-disclosure-url";
import {
  SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE,
  SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO,
  SYSTEM_HEALTH_HELP_SOURCES,
} from "@/lib/system-health-help-evidence-copy";
import { SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/system-health-help-page-copy";

/** Sources-only follow-ups for `/help/system-health` buyer-polished shell (HEY). */
export function HelpSystemHealthSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpSystemHealthSourcesOpenParam = searchParams.get("helpSystemHealthSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpSystemHealthSourcesOpenFromSearch(helpSystemHealthSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpSystemHealthSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpSystemHealthSourcesOpenFromSearch(helpSystemHealthSourcesOpenParam));
  }, [helpSystemHealthSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
      summaryLine={SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={SYSTEM_HEALTH_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-system-health-sources"
        headingId="where-to-go-next"
        title={SYSTEM_HEALTH_HELP_FOLLOW_UPS_TITLE}
        intro={SYSTEM_HEALTH_HELP_ORIENTATION_SOURCES_INTRO}
        links={SYSTEM_HEALTH_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
