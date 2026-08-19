import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_TRACE_CLAIM_DISCIPLINE,
  EVIDENCE_TRACE_SOURCES_INTRO,
  buildEvidenceTraceSources,
} from "@/lib/evidence-trace-evidence-copy";

import { EVIDENCE_TRACE_CLAIM_HEADING } from "./evidence-trace-page-copy";

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
      claim={EVIDENCE_TRACE_CLAIM_DISCIPLINE}
      claimHeading={EVIDENCE_TRACE_CLAIM_HEADING}
      sourcesIntro={EVIDENCE_TRACE_SOURCES_INTRO}
      sources={buildEvidenceTraceSources(props.runId, props.findingId)}
    />
  );
}
