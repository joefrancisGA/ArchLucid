import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE,
  CONNECT_AWS_SECURELY_SOURCES,
  CONNECT_AWS_SECURELY_SOURCES_INTRO,
} from "@/lib/connect-aws-securely-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/cloud-connections/aws`. */
export function ConnectAwsSecurelyHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="connect-aws-securely-help"
      claim={CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE}
      sourcesIntro={CONNECT_AWS_SECURELY_SOURCES_INTRO}
      sources={CONNECT_AWS_SECURELY_SOURCES}
    />
  );
}
