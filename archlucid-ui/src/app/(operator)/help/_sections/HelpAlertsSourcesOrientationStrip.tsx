"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ALERTS_HELP_FOLLOW_UPS_TITLE,
  ALERTS_HELP_SOURCES,
  ALERTS_HELP_SOURCES_INTRO,
} from "@/lib/alerts-help-evidence-copy";
import { ALERTS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/alerts-help-page-copy";
import {
  helpAlertsSourcesDisclosureHrefFromSearch,
  parseHelpAlertsSourcesOpenFromSearch,
} from "@/lib/help/help-alerts-sources-disclosure-url";

/** Sources-only follow-ups for `/help/alerts` buyer-polished shell (HA). */
export function HelpAlertsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpAlertsSourcesOpenParam = searchParams.get("helpAlertsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpAlertsSourcesOpenFromSearch(helpAlertsSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpAlertsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpAlertsSourcesOpenFromSearch(helpAlertsSourcesOpenParam));
  }, [helpAlertsSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ALERTS_HELP_FOLLOW_UPS_TITLE}
      summaryLine={ALERTS_HELP_SOURCES_INTRO}
      sectionTestId={ALERTS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-alerts-sources"
        headingId="where-to-go-next"
        title={ALERTS_HELP_FOLLOW_UPS_TITLE}
        intro={ALERTS_HELP_SOURCES_INTRO}
        links={ALERTS_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
