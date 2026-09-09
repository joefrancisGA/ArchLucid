import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  HELP_HUB_FOLLOW_UPS_TITLE,
  HELP_HUB_ORIENTATION_SOURCES,
  HELP_HUB_ORIENTATION_SOURCES_INTRO,
} from "@/lib/help/help-hub-evidence-copy";

/** Sources index for Help Center hub (HEL) — claim discipline lives in page header. */
export function HelpHubClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-hub"
      sourcesTitle={HELP_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={HELP_HUB_ORIENTATION_SOURCES_INTRO}
      sources={HELP_HUB_ORIENTATION_SOURCES}
      hubSecondary
    />
  );
}
