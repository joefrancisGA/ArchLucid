"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
  GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO,
} from "@/lib/governance/governance-approval-help-evidence-copy";
import { GOVERNANCE_APPROVAL_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/governance/governance-approval-help-page-copy";
import {
  helpGovernanceApprovalSourcesDisclosureHrefFromSearch,
  parseHelpGovernanceApprovalSourcesOpenFromSearch,
} from "@/lib/help/help-governance-approval-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpGovernanceApprovalSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-governance-approval-sources"
      searchParamKey="helpGovernanceApprovalSourcesOpen"
      parseOpenFromSearch={parseHelpGovernanceApprovalSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpGovernanceApprovalSourcesDisclosureHrefFromSearch}
      sectionTestId={GOVERNANCE_APPROVAL_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={GOVERNANCE_APPROVAL_HELP_FOLLOW_UPS_TITLE}
      intro={GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO}
      links={GOVERNANCE_APPROVAL_HELP_SOURCES}
      sourcesTestId="help-governance-approval-sources"
    />
  );
}
