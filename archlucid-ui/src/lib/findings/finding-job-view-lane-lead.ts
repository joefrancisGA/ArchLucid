import type { FindingJobView } from "@/lib/findings/finding-job-view";

/** One-line triage lane context on finding detail / inspect (TB-2315 / TB-2179). */
export const FINDING_JOB_VIEW_LANE_LEADS: Readonly<Record<FindingJobView, string>> = {
  "needs-my-decision": "Default triage lane — disposition or human review still open.",
  "needs-governance": "Needs approval evidence or human review sign-off before finalize.",
  deferred: "Deferred — revisit before you finalize the review record.",
  "ready-for-sponsor-packet": "Meets sponsor-packet trust bar once disposition is recorded.",
  "answer-these-questions": "Reads as blocked or unverified — answer intake gaps before treating severity as final.",
  "verify-hypotheses":
    "Exploratory or adversarial signal — verify with evidence before treating as publishable fact.",
  "resolve-contradictions": "Diagram vs narrative conflict — reconcile before finalize.",
  "coverage-gaps": "Requirement or coverage gap — map to an explicit design decision.",
  "disposition-closed": "Disposition recorded — triage lane is closed for this finding.",
};

export function findingJobViewLaneLead(jobView: FindingJobView): string {
  return FINDING_JOB_VIEW_LANE_LEADS[jobView];
}
