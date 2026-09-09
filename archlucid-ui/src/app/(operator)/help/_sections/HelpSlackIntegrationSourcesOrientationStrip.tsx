"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpSlackIntegrationSourcesDisclosureHrefFromSearch,
  parseHelpSlackIntegrationSourcesOpenFromSearch,
} from "@/lib/help/help-slack-integration-sources-disclosure-url";
import {
  SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/slack-integration-help-page-copy";

/** Sources-only follow-ups for `/help/slack-integration` buyer-polished shell (HSL). */
export function HelpSlackIntegrationSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpSlackIntegrationSourcesOpenParam = searchParams.get("helpSlackIntegrationSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpSlackIntegrationSourcesOpenFromSearch(helpSlackIntegrationSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpSlackIntegrationSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpSlackIntegrationSourcesOpenFromSearch(helpSlackIntegrationSourcesOpenParam));
  }, [helpSlackIntegrationSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      summaryLine={SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
      sectionTestId={SLACK_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-slack-integration-sources"
        headingId="where-to-go-next"
        title={SLACK_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
        intro={SLACK_INTEGRATION_HELP_ORIENTATION_SOURCES_INTRO}
        links={SLACK_INTEGRATION_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
