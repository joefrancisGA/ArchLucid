import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO,
} from "@/lib/accelerator-chooser-help-evidence-copy";

/** Sources index for accelerator chooser help (HAX). Claim discipline lives in the page header. */
export function AcceleratorChooserHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-accelerator-chooser"
      sourcesTitle={ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO}
      sources={ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS}
      sourcesTestId="help-accelerator-chooser-sources"
      hubSecondary
    />
  );
}
