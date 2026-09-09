"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  helpWebhooksIntegrationSourcesDisclosureHrefFromSearch,
  parseHelpWebhooksIntegrationSourcesOpenFromSearch,
} from "@/lib/help/help-webhooks-integration-sources-disclosure-url";
import {
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
  WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/webhooks-integration-help-evidence-copy";
import { WEBHOOKS_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/webhooks-integration-help-page-copy";

/** Sources-only follow-ups for `/help/webhooks-integration` buyer-polished shell (HEW). */
export function HelpWebhooksIntegrationSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpWebhooksIntegrationSourcesOpenParam = searchParams.get("helpWebhooksIntegrationSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpWebhooksIntegrationSourcesOpenFromSearch(helpWebhooksIntegrationSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        helpWebhooksIntegrationSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        {
          scroll: false,
        },
      );
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
    setSourcesOpenState(parseHelpWebhooksIntegrationSourcesOpenFromSearch(helpWebhooksIntegrationSourcesOpenParam));
  }, [helpWebhooksIntegrationSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      summaryLine={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
      sectionTestId={WEBHOOKS_INTEGRATION_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-webhooks-integration-sources"
        headingId="where-to-go-next"
        title={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
        intro={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
        links={WEBHOOKS_INTEGRATION_HELP_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
