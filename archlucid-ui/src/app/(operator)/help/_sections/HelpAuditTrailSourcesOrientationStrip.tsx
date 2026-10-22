"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";
import { AUDIT_TRAIL_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/audit-trail-help-page-copy";
import {
  helpAuditTrailSourcesDisclosureHrefFromSearch,
  parseHelpAuditTrailSourcesOpenFromSearch,
} from "@/lib/help/help-audit-trail-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpAuditTrailSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="audit-trail-help-sources"
      searchParamKey="helpAuditTrailSourcesOpen"
      parseOpenFromSearch={parseHelpAuditTrailSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpAuditTrailSourcesDisclosureHrefFromSearch}
      sectionTestId={AUDIT_TRAIL_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE}
      intro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      links={AUDIT_TRAIL_HELP_SOURCES}
      sourcesTestId="audit-trail-help-sources"
    />
  );
}
