import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";

export type ShowcaseHomeSampleFinding = {
  readonly id: string;
  readonly title: string;
  readonly severity: "critical" | "warning" | "info";
  readonly summary: string;
};

/** Buyer-safe static findings for secondary home preview references (TB-353). */
export const SHOWCASE_HOME_SAMPLE_FINDINGS: readonly ShowcaseHomeSampleFinding[] = [
  {
    id: SHOWCASE_HOME_AHA_MOMENT.id,
    title: SHOWCASE_HOME_AHA_MOMENT.title,
    severity: SHOWCASE_HOME_AHA_MOMENT.severity,
    summary: SHOWCASE_HOME_AHA_MOMENT.finding,
  },
  {
    id: "adjudication-handoff-idempotency",
    title: "Adjudication handoff replay risk",
    severity: "info",
    summary: "Event consumers need signed envelopes and idempotent replay before peak-load buffering.",
  },
  {
    id: "retention-residency-boundary",
    title: "Data residency control gap",
    severity: "info",
    summary: "Cold-path retention must enforce enterprise policy at the storage account boundary.",
  },
];

/** Home preview surfaces three buyer-safe findings; spine count must stay aligned with the showcase run. */
export const SHOWCASE_HOME_SAMPLE_FINDING_PREVIEW_COUNT = SHOWCASE_HOME_SAMPLE_FINDINGS.length;

export function showcaseHomeSampleFindingsAlignWithShowcaseRun(): boolean {
  return (
    SHOWCASE_HOME_SAMPLE_FINDINGS[0]?.id === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID
    && SHOWCASE_HOME_SAMPLE_FINDING_PREVIEW_COUNT <= SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount
  );
}
