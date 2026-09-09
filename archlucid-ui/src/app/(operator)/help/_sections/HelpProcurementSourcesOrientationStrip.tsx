"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  PROCUREMENT_HELP_FOLLOW_UPS_TITLE,
  PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO,
  PROCUREMENT_HELP_SOURCES,
} from "@/lib/procurement-help-evidence-copy";
import { PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/procurement-help-page-copy";
import {
  helpProcurementSourcesDisclosureHrefFromSearch,
  parseHelpProcurementSourcesOpenFromSearch,
} from "@/lib/help/help-procurement-sources-disclosure-url";

/** Sources-only follow-ups for `/help/procurement` buyer-polished shell (PRO). */
export function HelpProcurementSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpProcurementSourcesOpenParam = searchParams.get("helpProcurementSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpProcurementSourcesOpenFromSearch(helpProcurementSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpProcurementSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpProcurementSourcesOpenFromSearch(helpProcurementSourcesOpenParam));
  }, [helpProcurementSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={PROCUREMENT_HELP_FOLLOW_UPS_TITLE}
      summaryLine={PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={PROCUREMENT_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="procurement-help-sources"
        headingId="where-to-go-next"
        title={PROCUREMENT_HELP_FOLLOW_UPS_TITLE}
        intro={PROCUREMENT_HELP_ORIENTATION_SOURCES_INTRO}
        links={PROCUREMENT_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
