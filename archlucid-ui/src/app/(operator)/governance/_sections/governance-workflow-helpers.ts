import type { GovernanceApprovalRequest, GovernanceEnvironmentActivation, GovernancePromotionRecord } from "@/types/governance-workflow";

/** API values (ArchLucid.Contracts.Governance.GovernanceEnvironment). */
export const GOVERNANCE_ENV_OPTIONS = [
  { value: "dev", label: "Development" },
  { value: "test", label: "Staging" },
  { value: "prod", label: "Production" },
] as const;

export function governanceEnvironmentPairDisplay(source: string, target: string): string {
  const src = GOVERNANCE_ENV_OPTIONS.find((o) => o.value === source)?.label ?? source;
  const tgt = GOVERNANCE_ENV_OPTIONS.find((o) => o.value === target)?.label ?? target;

  return `${src} → ${tgt}`;
}

export function formatGovernanceBusinessInstant(iso: string): string {
  try {
    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
      return iso;
    }

    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function sortGovernancePromotions(rows: GovernancePromotionRecord[]): GovernancePromotionRecord[] {
  return [...rows].sort((x, y) => (x.promotedUtc < y.promotedUtc ? 1 : x.promotedUtc > y.promotedUtc ? -1 : 0));
}

export function sortGovernanceActivations(
  rows: GovernanceEnvironmentActivation[],
): GovernanceEnvironmentActivation[] {
  return [...rows].sort((x, y) => (x.activatedUtc < y.activatedUtc ? 1 : x.activatedUtc > y.activatedUtc ? -1 : 0));
}

export function governanceApprovalCardTitle(row: GovernanceApprovalRequest): string {
  const c = row.requestComment?.trim() ?? "";

  if (c.length > 0) {
    return c.length > 120 ? `${c.slice(0, 117)}…` : c;
  }

  return "Governance approval request";
}

export type GovernanceWorkflowToastState = { kind: "ok" | "err"; message: string } | null;

export type GovernanceWorkflowPendingReview = { approvalRequestId: string; mode: "approve" | "reject" };
