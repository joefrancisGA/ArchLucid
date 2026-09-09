"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO,
  AUTHENTICATION_SIGN_IN_HELP_SOURCES,
} from "@/lib/authentication-sign-in-help-evidence-copy";
import { AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/authentication-sign-in-help-page-copy";
import {
  helpAuthenticationSignInSourcesDisclosureHrefFromSearch,
  parseHelpAuthenticationSignInSourcesOpenFromSearch,
} from "@/lib/help/help-authentication-sign-in-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpAuthenticationSignInSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="authentication-sign-in-help-sources"
      searchParamKey="helpAuthenticationSignInSourcesOpen"
      parseOpenFromSearch={parseHelpAuthenticationSignInSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAuthenticationSignInSourcesDisclosureHrefFromSearch}
      sectionTestId={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={AUTHENTICATION_SIGN_IN_HELP_FOLLOW_UPS_TITLE}
      intro={AUTHENTICATION_SIGN_IN_HELP_ORIENTATION_SOURCES_INTRO}
      links={AUTHENTICATION_SIGN_IN_HELP_SOURCES}
      sourcesTestId="authentication-sign-in-help-sources"
    />
  );
}
