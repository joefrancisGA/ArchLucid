"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";
import { CONNECT_AZURE_SECURELY_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/connect-azure-securely-help-page-copy";
import {
  helpConnectAzureSecurelySourcesDisclosureHrefFromSearch,
  parseHelpConnectAzureSecurelySourcesOpenFromSearch,
} from "@/lib/help/help-connect-azure-securely-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpConnectAzureSecurelySourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-connect-azure-securely-sources"
      searchParamKey="helpConnectAzureSecurelySourcesOpen"
      parseOpenFromSearch={parseHelpConnectAzureSecurelySourcesOpenFromSearch}
      disclosureHrefFromSearch={helpConnectAzureSecurelySourcesDisclosureHrefFromSearch}
      sectionTestId={CONNECT_AZURE_SECURELY_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE}
      intro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      links={CONNECT_AZURE_SECURELY_SOURCES}
      sourcesTestId="help-connect-azure-securely-sources"
    />
  );
}
