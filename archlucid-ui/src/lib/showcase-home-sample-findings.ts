import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";

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
