import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
} from "@/lib/showcase-static-demo";

export type ShowcaseHomeSampleFinding = {
  readonly id: string;
  readonly title: string;
  readonly severity: "critical" | "warning" | "info";
  readonly summary: string;
};

/** Buyer-safe static findings for the home sample-review preview (TB-353). */
export const SHOWCASE_HOME_SAMPLE_FINDINGS: readonly ShowcaseHomeSampleFinding[] = [
  {
    id: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    title: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
    severity: "warning",
    summary: "PHI fields cross the claims API boundary without field-level encryption required by downstream processors.",
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
