import type { RunOperatorGovernanceDispositionDecision } from "@/lib/governance/governance-mutation-outcome-copy";

export const RUN_GOVERNANCE_DISP_DECISION_PARAM = "runDispDecision";

export const RUN_GOVERNANCE_DISP_DECISION_VALUES = ["approved", "rejected", "request-remediation"] as const;

export type RunGovernanceDispositionDecisionUrlValue = (typeof RUN_GOVERNANCE_DISP_DECISION_VALUES)[number];

const RUN_GOVERNANCE_DISP_DECISION_SET = new Set<string>(RUN_GOVERNANCE_DISP_DECISION_VALUES);

export function runGovernanceDispositionToUrlValue(
  decision: RunOperatorGovernanceDispositionDecision,
): RunGovernanceDispositionDecisionUrlValue {
  switch (decision) {
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    case "RequestRemediation":
      return "request-remediation";
    default: {
      const exhaustive: never = decision;
      return exhaustive;
    }
  }
}

export function runGovernanceDispositionFromUrlValue(
  value: RunGovernanceDispositionDecisionUrlValue,
): RunOperatorGovernanceDispositionDecision {
  switch (value) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "request-remediation":
      return "RequestRemediation";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

export function parseRunGovernanceDispositionDecisionFromSearch(
  raw: string | null | undefined,
): RunGovernanceDispositionDecisionUrlValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!RUN_GOVERNANCE_DISP_DECISION_SET.has(trimmed)) {
    return null;
  }

  return trimmed as RunGovernanceDispositionDecisionUrlValue;
}

export function runGovernanceDispositionConfirmHrefFromSearch(
  currentSearch: string,
  decision: RunGovernanceDispositionDecisionUrlValue | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (decision === null) {
    params.delete(RUN_GOVERNANCE_DISP_DECISION_PARAM);
  } else {
    params.set(RUN_GOVERNANCE_DISP_DECISION_PARAM, decision);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
