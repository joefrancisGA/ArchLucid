/** How the assigned-to-me findings queue was populated (GOF P0-1). */
export type GovernanceAssignedToMeFetchBasis =
  | "assigned-register"
  | "register-broad-filter"
  | "register-only";

export function governanceAssignedToMeFetchBasisLabel(
  basis: GovernanceAssignedToMeFetchBasis,
): string {
  switch (basis) {
    case "assigned-register":
      return "Searched open findings assigned to you in the architecture risk register for this workspace.";
    case "register-broad-filter":
      return "Searched the risk register with a broader assignment filter when the assigned-to-me register returned no rows.";
    case "register-only":
      return "Searched the assigned-to-me risk register only. Findings not yet projected to the register may be missing.";
    default: {
      const exhaustive: never = basis;
      return exhaustive;
    }
  }
}

export const GOVERNANCE_ASSIGNED_TO_ME_SEARCH_EXCLUSIONS =
  "Closed findings and findings assigned to other operators are excluded." as const;
