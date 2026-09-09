"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
  CLOUD_CONNECTIONS_SOURCES_INTRO,
} from "@/lib/cloud-connections-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/cloud-connections-help-page-copy";
import {
  helpCloudConnectionsSourcesDisclosureHrefFromSearch,
  parseHelpCloudConnectionsSourcesOpenFromSearch,
} from "@/lib/help/help-cloud-connections-sources-disclosure-url";

/** Sources-only follow-ups for `/help/cloud-connections` buyer-polished shell (HCE). */
export function HelpCloudConnectionsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("helpCloudConnectionsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseHelpCloudConnectionsSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(helpCloudConnectionsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseHelpCloudConnectionsSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE}
      summaryLine={CLOUD_CONNECTIONS_SOURCES_INTRO}
      sectionTestId={CLOUD_CONNECTIONS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="help-cloud-connections-sources"
        headingId="where-to-go-next"
        title={CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE}
        intro={CLOUD_CONNECTIONS_SOURCES_INTRO}
        links={CLOUD_CONNECTIONS_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
