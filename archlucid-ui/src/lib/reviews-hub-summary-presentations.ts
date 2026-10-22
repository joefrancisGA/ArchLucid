import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import {
  governanceRegisterMetricPresentation,
  type MetricCountPresentation,
  operatorHomeActiveReviewsPresentation,
  operatorHomeFinalizedPackagesPresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";

export function reviewsHubAwaitingApprovalPresentation(count: number): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "package awaiting approval" : "packages awaiting approval",
    dimensions: [{ kind: "workspace" }],
    href: GOVERNANCE_APPROVAL_QUEUE_PATH,
  };
}

export function reviewsHubInProgressPresentation(count: number): MetricCountPresentation {
  return operatorHomeActiveReviewsPresentation(count);
}

export function reviewsHubCommittedPresentation(count: number): MetricCountPresentation {
  return operatorHomeFinalizedPackagesPresentation(count);
}

export function reviewsHubOpenFindingsPresentation(count: number): MetricCountPresentation {
  return workspaceOpenFindingsPresentation(count);
}

export function reviewsHubOpenRisksPresentation(count: number): MetricCountPresentation {
  return governanceRegisterMetricPresentation({
    count,
    noun: count === 1 ? "open risk" : "open risks",
    filter: "open",
  });
}
