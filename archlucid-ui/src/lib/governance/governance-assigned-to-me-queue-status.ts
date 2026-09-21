import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { GovernanceAssignedToMeFetchBasis } from "@/lib/governance/governance-assigned-to-me-fetch-basis";

export type GovernanceAssignedToMeQueueStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** Header queue status — register-only empty loads are not marketed as Ready (SEA/GOF P0). */
export function resolveGovernanceAssignedToMeQueueStatusPresentation(
  assignedToMeCount: number,
  fetchBasis: GovernanceAssignedToMeFetchBasis | null,
): GovernanceAssignedToMeQueueStatusPresentation {
  if (assignedToMeCount > 0) {
    return {
      kind: "needs-attention",
      label:
        assignedToMeCount === 1
          ? "1 open finding assigned"
          : `${assignedToMeCount} open findings assigned`,
    };
  }

  if (fetchBasis === "register-only") {
    return {
      kind: "needs-attention",
      label: "0 assigned · register-only check",
    };
  }

  return {
    kind: "ready",
    label: "0 open findings assigned",
  };
}
