import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationLead } from "@/components/evidence-orientation/EvidenceOrientationLead";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import { ProcurementHelpDiligenceCtaSection } from "@/components/help/ProcurementHelpDiligenceCtaSection";
import { ProcurementHelpPostureSummary } from "@/components/help/ProcurementHelpPostureSummary";
import { PROCUREMENT_HELP_CLAIM_DISCIPLINE, PROCUREMENT_HELP_LEAD } from "@/lib/procurement-help-evidence-copy";

/** Claim discipline and posture summary for `/help/procurement` (no mid-page Sources band — TB-2092). */
export function ProcurementHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="procurement-help-orientation">
      <EvidenceOrientationLead testId="procurement-help-lead" text={PROCUREMENT_HELP_LEAD} />

      <EvidenceOrientationClaimCallout
        testId="procurement-help-claim-discipline"
        body={PROCUREMENT_HELP_CLAIM_DISCIPLINE}
      />

      <ProcurementHelpDiligenceCtaSection />

      <ProcurementHelpPostureSummary />
    </EvidenceOrientationStripShell>
  );
}
