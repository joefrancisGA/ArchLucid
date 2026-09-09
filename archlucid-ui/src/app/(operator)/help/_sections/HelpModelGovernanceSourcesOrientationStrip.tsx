"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  helpModelGovernanceSourcesDisclosureHrefFromSearch,
  parseHelpModelGovernanceSourcesOpenFromSearch,
} from "@/lib/help/help-model-governance-sources-disclosure-url";
import {
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
  MODEL_GOVERNANCE_HELP_SOURCES_INTRO,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/model-governance-help-page-copy";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpModelGovernanceSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-model-governance-sources"
      searchParamKey="helpModelGovernanceSourcesOpen"
      parseOpenFromSearch={parseHelpModelGovernanceSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpModelGovernanceSourcesDisclosureHrefFromSearch}
      sectionTestId={MODEL_GOVERNANCE_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE}
      intro={MODEL_GOVERNANCE_HELP_SOURCES_INTRO}
      links={MODEL_GOVERNANCE_HELP_SOURCES}
      sourcesTestId="help-model-governance-sources"
    />
  );
}
