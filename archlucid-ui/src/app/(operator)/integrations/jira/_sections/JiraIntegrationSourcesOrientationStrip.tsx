"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  jiraIntegrationSourcesDisclosureHrefFromSearch,
  parseJiraIntegrationSourcesOpenFromSearch,
} from "@/lib/integrations/jira-integration-sources-disclosure-url";
import {
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_ORIENTATION_SOURCES_INTRO,
  JIRA_INTEGRATION_SOURCES,
} from "@/lib/jira-integration-evidence-copy";
import { JIRA_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/jira-integration-shell-page-copy";

/** Sources-only follow-ups for `/integrations/jira` buyer-polished shell (IJX). */
export function JiraIntegrationSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("jiraIntegrationSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseJiraIntegrationSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(jiraIntegrationSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseJiraIntegrationSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={JIRA_INTEGRATION_FOLLOW_UPS_TITLE}
      summaryLine={JIRA_INTEGRATION_ORIENTATION_SOURCES_INTRO}
      sectionTestId={JIRA_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="jira-integration-sources"
        headingId="where-to-go-next"
        title={JIRA_INTEGRATION_FOLLOW_UPS_TITLE}
        intro={JIRA_INTEGRATION_ORIENTATION_SOURCES_INTRO}
        links={JIRA_INTEGRATION_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
