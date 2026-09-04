import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE,
  BILLING_AND_PLANS_HELP_SOURCES,
  BILLING_AND_PLANS_HELP_SOURCES_INTRO,
} from "@/lib/billing-and-plans-help-evidence-copy";

/** Sources-only follow-ups for `/help/billing-and-plans` buyer-polished shell (HBX). */
export function HelpBillingAndPlansSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-billing-and-plans"
      sourcesTestId="help-billing-and-plans-sources"
      sourcesTitle={BILLING_AND_PLANS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={BILLING_AND_PLANS_HELP_SOURCES_INTRO}
      sources={BILLING_AND_PLANS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
