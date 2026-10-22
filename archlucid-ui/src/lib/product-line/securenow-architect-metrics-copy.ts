import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

export const SECURENOW_ARCHITECT_METRICS_TITLE = secureNowTitleCase("Architect outcome metrics");

export const SECURENOW_ARCHITECT_METRICS_LEAD =
  "Compare inventory snapshots for architecture outcomes (SA-11). Headline counts describe path removal and posture change — not ticket burn-down." as const;

export const SECURENOW_ARCHITECT_METRICS_FROM_LABEL = secureNowTitleCase("From snapshot");

export const SECURENOW_ARCHITECT_METRICS_TO_LABEL = secureNowTitleCase("To snapshot");

export const SECURENOW_ARCHITECT_METRICS_COMPARE_BUTTON = secureNowTitleCase("Compare snapshots");

export const SECURENOW_ARCHITECT_METRICS_LOADING = "Loading architect outcome metrics…" as const;

export const SECURENOW_ARCHITECT_METRICS_ERROR = "Architect outcome metrics unavailable" as const;

export const SECURENOW_ARCHITECT_METRICS_SNAPSHOTS_EMPTY =
  "At least two inventory snapshots are required to compare architect outcomes." as const;

const SECURENOW_ARCHITECT_METRICS_RULE_VERSION_EXPLANATIONS: Readonly<Record<string, string>> = {
  "SA11-metrics-v1":
    "These snapshot-comparison headline numbers were calculated with the SA-11 architect metrics specification, version 1.",
};

export function formatSecureNowArchitectMetricsRuleVersionExplanation(ruleVersion: string): string {
  const trimmed = ruleVersion.trim();

  if (trimmed.length === 0) {
    return "These snapshot-comparison headline numbers use an unspecified calculation rule.";
  }

  const known = SECURENOW_ARCHITECT_METRICS_RULE_VERSION_EXPLANATIONS[trimmed];

  if (known !== undefined) {
    return known;
  }

  return `These snapshot-comparison headline numbers were calculated with rule version ${trimmed}.`;
}

export const SECURENOW_ARCHITECT_METRICS_SUPPORTING_OPEN_FINDINGS = "Supporting: open findings" as const;

export const SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED = "Critical/high paths removed" as const;

export const SECURENOW_ARCHITECT_METRICS_PRIVILEGED_NODES_REDUCED = "Privileged identity nodes reduced" as const;

export const SECURENOW_ARCHITECT_METRICS_EGRESS_PATHS_REDUCED = "Unrestricted egress paths reduced" as const;

export const SECURENOW_ARCHITECT_METRICS_CROWN_JEWEL_PATHS_REMOVED = "Crown jewel exposure paths removed" as const;

export const SECURENOW_ARCHITECT_METRICS_BLAST_RADIUS_PATHS_REMOVED = "Shared-control blast radius paths removed" as const;

export const SECURENOW_ARCHITECT_METRICS_EXCEPTIONS_EXPIRED = "Exceptions expired" as const;

export const SECURENOW_ARCHITECT_METRICS_REMEDIATION_RECURRENCE = "Remediation recurrence" as const;
