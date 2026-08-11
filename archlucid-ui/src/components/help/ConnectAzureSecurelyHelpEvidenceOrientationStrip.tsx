import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AZURE_SECURELY_SOURCES,
  CONNECT_AZURE_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-azure-securely-help-content";

/** Claim discipline + diligence artifact index for `/help/cloud-connections/azure`. */
export function ConnectAzureSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-azure-securely-help"
      claim={CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE}
      sourcesIntro={CONNECT_AZURE_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AZURE_SECURELY_SOURCES}
    />
  );
}
