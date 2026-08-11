import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationLead } from "@/components/evidence-orientation/EvidenceOrientationLead";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
  CAIQ_SIG_RESPONSE_HELP_LEAD,
  CAIQ_SIG_RESPONSE_HELP_SOURCES,
  CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";
import { cn } from "@/lib/utils";

/** Claim discipline + diligence artifact index for `/help/caiq-sig-response`. */
export function CaiqSigResponseHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="caiq-sig-response-help-orientation">
      <EvidenceOrientationLead
        testId="caiq-sig-response-help-lead"
        text={CAIQ_SIG_RESPONSE_HELP_LEAD}
      />

      <EvidenceOrientationClaimCallout
        testId="caiq-sig-response-help-claim-discipline"
        body={CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE}
        heading={{
          id: "caiq-sig-response-help-claim-heading",
          text: CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
        }}
      >
        <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </EvidenceOrientationClaimCallout>

      <EvidenceOrientationSourcesSection
        testId="caiq-sig-response-help-sources"
        headingId="caiq-sig-response-help-sources-heading"
        title={HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        intro={CAIQ_SIG_RESPONSE_HELP_SOURCES_INTRO}
        links={CAIQ_SIG_RESPONSE_HELP_SOURCES}
        layout="stacked"
      />
    </EvidenceOrientationStripShell>
  );
}
