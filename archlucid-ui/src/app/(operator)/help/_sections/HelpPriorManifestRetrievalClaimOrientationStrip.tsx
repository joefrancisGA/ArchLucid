import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";

/** Sources follow-ups for `/help/prior-manifest-retrieval` (HPR). */
export function HelpPriorManifestRetrievalClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-prior-manifest-retrieval"
      sourcesTestId="help-prior-manifest-retrieval-sources"
      sourcesTitle={PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES_INTRO}
      sources={PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES}
    />
  );
}
