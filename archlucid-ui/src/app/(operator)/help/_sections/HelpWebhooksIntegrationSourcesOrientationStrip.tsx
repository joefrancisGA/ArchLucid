import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
  WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO,
} from "@/lib/webhooks-integration-help-evidence-copy";

/** Sources-only follow-ups for `/help/webhooks-integration` buyer-polished shell (HEW). */
export function HelpWebhooksIntegrationSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-webhooks-integration"
      sourcesTestId="help-webhooks-integration-sources"
      sourcesTitle={WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={WEBHOOKS_INTEGRATION_HELP_SOURCES_INTRO}
      sources={WEBHOOKS_INTEGRATION_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
