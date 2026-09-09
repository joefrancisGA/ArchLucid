"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
  CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import { CAIQ_SIG_RESPONSE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/caiq-sig-response-help-page-copy";
import {
  helpCaiqSigResponseSourcesDisclosureHrefFromSearch,
  parseHelpCaiqSigResponseSourcesOpenFromSearch,
} from "@/lib/help/help-caiq-sig-response-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpCaiqSigResponseSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-caiq-sig-response-sources"
      searchParamKey="helpCaiqSigResponseSourcesOpen"
      parseOpenFromSearch={parseHelpCaiqSigResponseSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpCaiqSigResponseSourcesDisclosureHrefFromSearch}
      sectionTestId={CAIQ_SIG_RESPONSE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={CAIQ_SIG_RESPONSE_HELP_FOLLOW_UPS_TITLE}
      intro={CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
      links={CAIQ_SIG_RESPONSE_HELP_SOURCES}
      sourcesTestId="help-caiq-sig-response-sources"
    />
  );
}
