"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_SOURCES,
  SECURITY_TRUST_HELP_SOURCES_INTRO,
} from "@/lib/security-trust-help-evidence-copy";
import { SECURITY_TRUST_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/security-trust-help-page-copy";
import {
  helpSecurityTrustSourcesDisclosureHrefFromSearch,
  parseHelpSecurityTrustSourcesOpenFromSearch,
} from "@/lib/help/help-security-trust-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpSecurityTrustSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-security-trust-sources"
      searchParamKey="helpSecurityTrustSourcesOpen"
      parseOpenFromSearch={parseHelpSecurityTrustSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpSecurityTrustSourcesDisclosureHrefFromSearch}
      sectionTestId={SECURITY_TRUST_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE}
      intro={SECURITY_TRUST_HELP_SOURCES_INTRO}
      links={SECURITY_TRUST_HELP_SOURCES}
      sourcesTestId="help-security-trust-sources"
    />
  );
}
