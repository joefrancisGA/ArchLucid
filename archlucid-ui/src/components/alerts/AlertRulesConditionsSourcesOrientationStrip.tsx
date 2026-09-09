"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE,
  ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID,
  ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES,
  ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO,
} from "@/lib/alert-rules-conditions-evidence-copy";
import {
  alertRulesConditionsSourcesDisclosureHrefFromSearch,
  parseAlertRulesConditionsSourcesOpenFromSearch,
} from "@/lib/alerts/alert-rules-conditions-sources-disclosure-url";

/** Sources-only follow-ups for `/governance/alert-rules?tab=rules` buyer-polished shell (GLR). */
export function AlertRulesConditionsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("alertRulesConditionsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseAlertRulesConditionsSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(alertRulesConditionsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseAlertRulesConditionsSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE}
      summaryLine={ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO}
      sectionTestId={ALERT_RULES_CONDITIONS_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="alert-rules-conditions-sources"
        headingId="where-to-go-next"
        title={ALERT_RULES_CONDITIONS_FOLLOW_UPS_TITLE}
        intro={ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO}
        links={ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
