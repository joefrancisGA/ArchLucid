import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import { ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/accelerator-chooser-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Sources-only follow-ups for `/help/accelerator-chooser` buyer-polished shell (HAX). */
export function AcceleratorChooserHelpSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-accelerator-chooser"
      stripTestId={ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="help-accelerator-chooser-sources"
      sourcesTitle={ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCELERATOR_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO}
      sources={ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
