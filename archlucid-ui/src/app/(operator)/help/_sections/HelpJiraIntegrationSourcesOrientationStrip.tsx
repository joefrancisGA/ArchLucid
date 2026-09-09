"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpJiraIntegrationSourcesDisclosureHrefFromSearch,
  parseHelpJiraIntegrationSourcesOpenFromSearch,
} from "@/lib/help/help-jira-integration-sources-disclosure-url";
import {
  JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO,
  JIRA_INTEGRATION_HELP_SOURCES,
} from "@/lib/jira-integration-help-evidence-copy";
import { JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/jira-integration-help-page-copy";

/** Sources-only follow-ups for `/help/jira-integration` buyer-polished shell (HEJ). */
export function HelpJiraIntegrationSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpJiraIntegrationSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpJiraIntegrationSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpJiraIntegrationSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpJiraIntegrationSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      summaryLine={JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={JIRA_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-jira-integration-sources"
        headingId="where-to-go-next"
        title={JIRA_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
        intro={JIRA_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
        links={JIRA_INTEGRATION_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
