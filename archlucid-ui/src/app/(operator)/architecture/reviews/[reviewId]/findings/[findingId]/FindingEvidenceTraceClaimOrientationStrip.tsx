"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
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
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="finding-eru"
      stripTestId="finding-eru-orientation"
      sourcesTestId="finding-eru-sources"
      sourcesIntro={EVIDENCE_TRACE_SOURCES_INTRO}
      sources={buildEvidenceTraceSources(props.runId, props.findingId, productLine)}
    />
  );
}
