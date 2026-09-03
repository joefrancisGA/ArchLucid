import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO,
} from "@/lib/specialty-walkthroughs-help-evidence-copy";

/** Sources follow-ups for `/help/specialty-walkthroughs` (HS). */
export function HelpSpecialtyWalkthroughClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-specialty-walkthroughs"
      sourcesTestId="help-specialty-walkthroughs-sources"
      sourcesTitle={SPECIALTY_WALKTHROUGHS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={SPECIALTY_WALKTHROUGHS_HELP_SOURCES_INTRO}
      sources={SPECIALTY_WALKTHROUGHS_HELP_SOURCES}
    />
  );
}
