import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  CONTEXTUAL_HELP_DRAWER_SOURCES,
  CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO,
} from "@/lib/contextual-help-drawer-evidence-copy";

/** Claim discipline + Sources index for the contextual help drawer (HCD). */
export function HelpDrawerClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="contextual-help-drawer"
      sourcesIntro={CONTEXTUAL_HELP_DRAWER_SOURCES_INTRO}
      sources={CONTEXTUAL_HELP_DRAWER_SOURCES}
    />
  );
}
