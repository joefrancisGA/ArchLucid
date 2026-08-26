import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_TRACE_SOURCES_INTRO,
  buildEvidenceTraceSources,
} from "@/lib/evidence-trace-evidence-copy";



export type FindingEvidenceTraceClaimOrientationStripProps = {
  readonly runId: string;
  readonly findingId: string;
};

/** Claim discipline + Sources index for finding evidence-trace (ERU). */
export function FindingEvidenceTraceClaimOrientationStrip(
  props: FindingEvidenceTraceClaimOrientationStripProps,
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="finding-eru"
      stripTestId="finding-eru-orientation"
      sourcesIntro={EVIDENCE_TRACE_SOURCES_INTRO}
      sources={buildEvidenceTraceSources(props.runId, props.findingId)}
    />
  );
}
