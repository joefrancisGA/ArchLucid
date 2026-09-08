import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
  HELP_TOPIC_CATCHALL_SOURCES,
  HELP_TOPIC_CATCHALL_SOURCES_INTRO,
} from "@/lib/help/help-topic-catchall-evidence-copy";

/** Sources index for residual help-topic catch-all markdown (HE.). Claim discipline lives in the page header. */
export function HelpTopicCatchallEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-topic-catchall"
      sourcesTitle={HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE}
      sourcesIntro={HELP_TOPIC_CATCHALL_SOURCES_INTRO}
      sources={HELP_TOPIC_CATCHALL_SOURCES}
      sourcesTestId="help-topic-catchall-sources"
      hubSecondary
    />
  );
}
