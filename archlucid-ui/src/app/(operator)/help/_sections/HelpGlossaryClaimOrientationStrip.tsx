import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  GLOSSARY_HELP_FOLLOW_UP_LINKS,
  GLOSSARY_HELP_FOLLOW_UPS_TITLE,
  GLOSSARY_HELP_SOURCES_INTRO,
} from "@/lib/glossary-help-evidence-copy";

/** Sources follow-ups for `/help/glossary` (HGE). */
export function HelpGlossaryClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-glossary"
      sourcesTestId="help-glossary-sources"
      sourcesTitle={GLOSSARY_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={GLOSSARY_HELP_SOURCES_INTRO}
      sources={GLOSSARY_HELP_FOLLOW_UP_LINKS}
    />
  );
}
