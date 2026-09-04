import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";

/** Sources-only follow-ups for `/help/cloud-connections/azure` buyer-polished shell (HC). */
export function HelpConnectAzureSecurelySourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-connect-azure-securely"
      sourcesTestId="help-connect-azure-securely-sources"
      sourcesTitle={CONNECT_AZURE_SECURELY_FOLLOW_UPS_TITLE}
      sourcesIntro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AZURE_SECURELY_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
