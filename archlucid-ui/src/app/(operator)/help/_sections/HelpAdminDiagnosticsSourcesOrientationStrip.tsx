"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE,
  ADMIN_DIAGNOSTICS_HELP_ORIENTATION_SOURCES_INTRO,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { ADMIN_DIAGNOSTICS_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/admin-diagnostics-help-page-copy";
import {
  helpAdminDiagnosticsSourcesDisclosureHrefFromSearch,
  parseHelpAdminDiagnosticsSourcesOpenFromSearch,
} from "@/lib/help/help-admin-diagnostics-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open (HAD). */
export function HelpAdminDiagnosticsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-admin-diagnostics-sources"
      searchParamKey="helpAdminDiagnosticsSourcesOpen"
      parseOpenFromSearch={parseHelpAdminDiagnosticsSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAdminDiagnosticsSourcesDisclosureHrefFromSearch}
      sectionTestId={ADMIN_DIAGNOSTICS_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE}
      intro={ADMIN_DIAGNOSTICS_HELP_ORIENTATION_SOURCES_INTRO}
      links={ADMIN_DIAGNOSTICS_HELP_SOURCES}
      sourcesTestId="help-admin-diagnostics-sources"
    />
  );
}
