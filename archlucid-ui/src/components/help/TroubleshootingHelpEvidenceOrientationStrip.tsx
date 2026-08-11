import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationMetaLine } from "@/components/evidence-orientation/EvidenceOrientationMetaLine";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  TROUBLESHOOTING_HELP_APPLICABILITY,
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL,
  TROUBLESHOOTING_HELP_RELATED_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
  TROUBLESHOOTING_HELP_SOURCES_INTRO,
} from "@/lib/troubleshooting-help-evidence-copy";

/** Freshness + claim discipline for `/help/troubleshooting` (not a diligence Sources trail). */
export function TroubleshootingHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId="troubleshooting-help-orientation">
      <EvidenceOrientationClaimCallout
        testId="troubleshooting-help-claim-discipline"
        body={TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE}
      />

      <EvidenceOrientationMetaLine
        testId="troubleshooting-help-freshness"
        label={TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL}
        text={TROUBLESHOOTING_HELP_APPLICABILITY}
      />

      <EvidenceOrientationSourcesSection
        testId="troubleshooting-help-related"
        headingId="troubleshooting-help-related-heading"
        title={TROUBLESHOOTING_HELP_RELATED_TITLE}
        intro={TROUBLESHOOTING_HELP_SOURCES_INTRO}
        links={TROUBLESHOOTING_HELP_SOURCES}
      />
    </EvidenceOrientationStripShell>
  );
}
