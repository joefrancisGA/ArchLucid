"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";

import {
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  resolveCloudConnectionsSources,
  resolveCloudConnectionsSourcesIntro,
} from "@/lib/cloud-connections-evidence-copy";
import { CLOUD_CONNECTIONS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/cloud-connections-help-page-copy";
import {
  helpCloudConnectionsSourcesDisclosureHrefFromSearch,
  parseHelpCloudConnectionsSourcesOpenFromSearch,
} from "@/lib/help/help-cloud-connections-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpCloudConnectionsSourcesOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-cloud-connections-sources"
      searchParamKey="helpCloudConnectionsSourcesOpen"
      parseOpenFromSearch={parseHelpCloudConnectionsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpCloudConnectionsSourcesDisclosureHrefFromSearch}
      sectionTestId={CLOUD_CONNECTIONS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE}
      intro={resolveCloudConnectionsSourcesIntro(productLine)}
      links={resolveCloudConnectionsSources(productLine)}
      sourcesTestId="help-cloud-connections-sources"
    />
  );
}
