import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import { ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/accelerator-chooser-help-page-copy";

/** Sources-only follow-ups for `/help/accelerator-chooser` buyer-polished shell (HAX). */
export function AcceleratorChooserHelpSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-accelerator-chooser"
      stripTestId={ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTitle={ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO}
      sources={ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS}
      sourcesTestId="help-accelerator-chooser-sources"
      hubSecondary
    />
  );
}
