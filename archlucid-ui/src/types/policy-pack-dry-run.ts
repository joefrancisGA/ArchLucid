import type { components } from "@/lib/openapi-schemas";

/**
 * Mirrors `ArchLucid.Contracts.Governance.PolicyPackDryRunResponse` and friends. See
 * `docs/library/AUDIT_COVERAGE_MATRIX.md` for the audit-trail companion.
 */

export type PolicyPackDryRunSeverityCount = components["schemas"]["PolicyPackDryRunSeverityCount"];

export type PolicyPackDryRunThresholdOutcome = components["schemas"]["PolicyPackDryRunThresholdOutcome"];

export type PolicyPackDryRunRunItem = components["schemas"]["PolicyPackDryRunRunItem"];

type PolicyPackDryRunDeltaCountsSchema = components["schemas"]["PolicyPackDryRunDeltaCounts"];

export type PolicyPackDryRunDeltaCounts = PolicyPackDryRunDeltaCountsSchema &
  Required<
    Pick<PolicyPackDryRunDeltaCountsSchema, "evaluated" | "runMissing" | "wouldAllow" | "wouldBlock">
  >;

type PolicyPackDryRunResponseSchema = components["schemas"]["PolicyPackDryRunResponse"];

export type PolicyPackDryRunResponse = Omit<PolicyPackDryRunResponseSchema, "deltaCounts"> &
  Required<
    Pick<
      PolicyPackDryRunResponseSchema,
      | "policyPackId"
      | "evaluatedUtc"
      | "page"
      | "pageSize"
      | "returnedRuns"
      | "totalRequestedRuns"
      | "proposedThresholdsRedactedJson"
    >
  > & {
    deltaCounts: PolicyPackDryRunDeltaCounts;
  };

export type PolicyPackDryRunRequest = components["schemas"]["PolicyPackDryRunRequest"];

/**
 * Default page size for the policy dry-run modal. Owner Q38 (2026-04-23) fixed
 * the default at 20 with a server-side cap of 100. Vitest asserts this constant so a
 * silent regression to a different default is caught at lint/test time.
 */
export const POLICY_PACK_DRY_RUN_DEFAULT_PAGE_SIZE = 20;

/** Server-side cap on page size; the API will clamp anything larger. */
export const POLICY_PACK_DRY_RUN_MAX_PAGE_SIZE = 100;
