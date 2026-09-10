"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_HELP_SOURCES,
  DECISION_REGISTER_HELP_SOURCES_INTRO,
} from "@/lib/decision-register-help-evidence-copy";
import { DECISION_REGISTER_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/decision-register-help-page-copy";
import {
  helpDecisionRegisterSourcesDisclosureHrefFromSearch,
  parseHelpDecisionRegisterSourcesOpenFromSearch,
} from "@/lib/help/help-decision-register-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpDecisionRegisterSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-decision-register-sources"
      searchParamKey="helpDecisionRegisterSourcesOpen"
      parseOpenFromSearch={parseHelpDecisionRegisterSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpDecisionRegisterSourcesDisclosureHrefFromSearch}
      sectionTestId={DECISION_REGISTER_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={DECISION_REGISTER_HELP_FOLLOW_UPS_TITLE}
      intro={DECISION_REGISTER_HELP_SOURCES_INTRO}
      links={DECISION_REGISTER_HELP_SOURCES}
      sourcesTestId="help-decision-register-sources"
    />
  );
}
