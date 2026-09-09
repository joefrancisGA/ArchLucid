"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  parseServicenowIntegrationSourcesOpenFromSearch,
  servicenowIntegrationSourcesDisclosureHrefFromSearch,
} from "@/lib/integrations/servicenow-integration-sources-disclosure-url";
import {
  SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE,
  SERVICENOW_INTEGRATION_ORIENTATION_SOURCES_INTRO,
  SERVICENOW_INTEGRATION_SOURCES,
} from "@/lib/servicenow-integration-evidence-copy";
import { SERVICENOW_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/servicenow-integration-shell-page-copy";

/** Sources-only follow-ups for `/integrations/servicenow` buyer-polished shell (ISX). */
export function ServiceNowIntegrationSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const servicenowIntegrationSourcesOpenParam = searchParams.get("servicenowIntegrationSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseServicenowIntegrationSourcesOpenFromSearch(servicenowIntegrationSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(servicenowIntegrationSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseServicenowIntegrationSourcesOpenFromSearch(servicenowIntegrationSourcesOpenParam));
  }, [servicenowIntegrationSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE}
      summaryLine={SERVICENOW_INTEGRATION_ORIENTATION_SOURCES_INTRO}
      sectionTestId={SERVICENOW_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="servicenow-integration-sources"
        headingId="where-to-go-next"
        title={SERVICENOW_INTEGRATION_FOLLOW_UPS_TITLE}
        intro={SERVICENOW_INTEGRATION_ORIENTATION_SOURCES_INTRO}
        links={SERVICENOW_INTEGRATION_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
