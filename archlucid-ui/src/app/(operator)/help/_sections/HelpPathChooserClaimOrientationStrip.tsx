import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  PATH_CHOOSER_HELP_ORIENTATION_SOURCES,
  PATH_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO,
} from "@/lib/path-chooser-help-evidence-copy";

/** Sources follow-ups for `/help/choose-your-next-step` (HPX). */
export function HelpPathChooserClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-path-chooser-bottom"
      sourcesTestId="help-path-chooser-sources"
      sourcesTitle={PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PATH_CHOOSER_HELP_ORIENTATION_SOURCES_INTRO}
      sources={PATH_CHOOSER_HELP_ORIENTATION_SOURCES}
      sourcesHeadingId="related-next-steps"
      hubSecondary
    />
  );
}
