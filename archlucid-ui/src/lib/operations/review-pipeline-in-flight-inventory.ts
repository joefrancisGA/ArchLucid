import type { ErrorRecoveryContractGuardedSurface } from "@/lib/error-recovery-contract-inventory";

const IN_FLIGHT_REGISTRATION_MARKERS: readonly string[] = ["trackReviewPipelineInFlight"];

/**
 * Every path that starts an architecture review must register it with the shell in-flight tracker
 * (TB-2077). Without the row, navigating away from the wizard leaves no indication that analysis is
 * still running, which is what prompts a duplicate submission.
 *
 * Reuses the marker-presence guard shape so a new create surface fails the suite instead of shipping
 * silent work.
 */
export const REVIEW_PIPELINE_IN_FLIGHT_SURFACES: readonly ErrorRecoveryContractGuardedSurface[] = [
  {
    // Shared RHF create path: QuickStart, SimplifiedPilot, and the full NewRun shell.
    id: "wizard-form-create-run",
    sourceRoots: ["lib/wizard-form-create-run-submit.ts"],
    requiredMarkers: IN_FLIGHT_REGISTRATION_MARKERS,
  },
  {
    id: "first-pilot-intake-wizard",
    sourceRoots: ["app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.tsx"],
    requiredMarkers: IN_FLIGHT_REGISTRATION_MARKERS,
  },
  {
    // Guided intake submits the admitted draft to the canonical POST /v1/architecture/request.
    id: "guided-intake-draft-submit",
    sourceRoots: ["app/(operator)/architecture/reviews/new/use-guided-intake-draft-workflow.ts"],
    requiredMarkers: IN_FLIGHT_REGISTRATION_MARKERS,
  },
  {
    // Tier C async re-execute already registered before TB-2077 was extended to create.
    id: "architecture-run-async-execute",
    sourceRoots: ["lib/api/architecture-runs.ts"],
    requiredMarkers: ["trackInFlightOperation", "reviewPipelineOperationId"],
  },
] as const;
