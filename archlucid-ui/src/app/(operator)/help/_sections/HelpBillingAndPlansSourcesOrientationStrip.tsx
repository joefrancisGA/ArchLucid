"use client";

import { UrlSyncedSourcesCollapsibleStrip } from "@/components/evidence-orientation/UrlSyncedSourcesCollapsibleStrip";
import {
  BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE,
  BILLING_AND_PLANS_HELP_SOURCES,
  BILLING_AND_PLANS_HELP_SOURCES_INTRO,
} from "@/lib/billing-and-plans-help-evidence-copy";
import { BILLING_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/billing-and-plans-help-page-copy";
import {
  helpBillingAndPlansSourcesDisclosureHrefFromSearch,
  parseHelpBillingAndPlansSourcesOpenFromSearch,
} from "@/lib/help/help-billing-and-plans-sources-disclosure-url";

/** Sources-only follow-ups — URL-synced disclosure with pre-commit auto-open. */
export function HelpBillingAndPlansSourcesOrientationStrip(): React.JSX.Element {
  return (
    <UrlSyncedSourcesCollapsibleStrip
      surfaceId="help-billing-and-plans-sources"
      searchParamKey="helpBillingAndPlansSourcesOpen"
      parseOpenFromSearch={parseHelpBillingAndPlansSourcesOpenFromSearch}
      disclosureHrefFromSearch={helpBillingAndPlansSourcesDisclosureHrefFromSearch}
      sectionTestId={BILLING_HELP_ORIENTATION_BOTTOM_TEST_ID}
      title={BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE}
      intro={BILLING_AND_PLANS_HELP_SOURCES_INTRO}
      links={BILLING_AND_PLANS_HELP_SOURCES}
      sourcesTestId="help-billing-and-plans-sources"
    />
  );
}
