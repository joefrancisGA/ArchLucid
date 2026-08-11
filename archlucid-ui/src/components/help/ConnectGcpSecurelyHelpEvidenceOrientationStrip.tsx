import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_GCP_SECURELY_SOURCES,
  CONNECT_GCP_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-gcp-securely-help-evidence-copy";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";

export const CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING = "Connector setup orientation";

/** Claim discipline + diligence artifact index for `/help/cloud-connections/gcp`. */
export function ConnectGcpSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="connect-gcp-securely-help-orientation">
      <EvidenceOrientationClaimCallout
        testId="connect-gcp-securely-help-claim-discipline"
        body={CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE}
        tone="info"
        heading={{
          id: "connect-gcp-securely-help-claim-discipline-heading",
          text: CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING,
          visuallyHidden: true,
        }}
      />

      <EvidenceOrientationSourcesSection
        testId="connect-gcp-securely-help-sources"
        headingId="connect-gcp-securely-help-sources-heading"
        title={HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        intro={CONNECT_GCP_SECURELY_SOURCES_INTRO}
        links={CONNECT_GCP_SECURELY_SOURCES}
      />
    </EvidenceOrientationStripShell>
  );
}
