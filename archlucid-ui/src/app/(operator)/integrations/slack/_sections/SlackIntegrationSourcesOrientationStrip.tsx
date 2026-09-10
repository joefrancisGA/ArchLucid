"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  parseSlackIntegrationSourcesOpenFromSearch,
  slackIntegrationSourcesDisclosureHrefFromSearch,
} from "@/lib/integrations/slack-integration-sources-disclosure-url";
import {
  SLACK_INTEGRATION_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_ORIENTATION_SOURCES_INTRO,
  SLACK_INTEGRATION_SOURCES,
} from "@/lib/slack-integration-evidence-copy";
import { SLACK_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/slack-integration-shell-page-copy";

/** Sources-only follow-ups for `/integrations/slack` buyer-polished shell (ISN). */
export function SlackIntegrationSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("slackIntegrationSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseSlackIntegrationSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(slackIntegrationSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseSlackIntegrationSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={SLACK_INTEGRATION_FOLLOW_UPS_TITLE}
      summaryLine={SLACK_INTEGRATION_ORIENTATION_SOURCES_INTRO}
      sectionTestId={SLACK_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="slack-integration-sources"
        headingId="where-to-go-next"
        title={SLACK_INTEGRATION_FOLLOW_UPS_TITLE}
        intro={SLACK_INTEGRATION_ORIENTATION_SOURCES_INTRO}
        links={SLACK_INTEGRATION_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
