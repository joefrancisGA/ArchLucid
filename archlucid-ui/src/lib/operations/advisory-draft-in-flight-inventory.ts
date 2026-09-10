import type { ErrorRecoveryContractGuardedSurface } from "@/lib/error-recovery-contract-inventory";

const IN_FLIGHT_REGISTRATION_MARKERS: readonly string[] = ["trackAdvisoryDraftInFlight"];

/**
 * Suggest from overview returns 202 and keeps running on the server. Without a shell In progress
 * row, leaving the architecture draft hides the only handle the operator has for that queued work.
 */
export const ADVISORY_DRAFT_IN_FLIGHT_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] = [
  {
    id: "structured-brief-suggest-async-accept",
    sourceRoots: ["lib/api/architecture-request-draft-async-api-resume.ts"],
    requiredMarkers: IN_FLIGHT_REGISTRATION_MARKERS,
  },
] as const;
