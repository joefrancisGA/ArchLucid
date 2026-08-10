import type { QueryKey } from "@tanstack/react-query";

const PERSISTABLE_OPERATOR_QUERY_SEGMENTS = new Set([
  "tenant",
  "health",
  "llm",
  "alerts",
  "runs",
  "digests",
  "analytics",
  "governance",
]);

const PERSISTABLE_GOVERNANCE_SEGMENTS = new Set(["compliance-drift-trend", "findings-queue"]);

const PERSISTABLE_LLM_SEGMENTS = new Set(["monthly-budget-status"]);

const PERSISTABLE_RUNS_SEGMENTS = new Set(["paged"]);

/** Allowlist for operator Query keys safe to persist in sessionStorage (TB-2165). */
export function shouldPersistOperatorQueryKey(queryKey: QueryKey): boolean {
  if (!Array.isArray(queryKey) || queryKey[0] !== "operator") {
    return false;
  }

  const segment = queryKey[1];

  if (typeof segment !== "string" || !PERSISTABLE_OPERATOR_QUERY_SEGMENTS.has(segment)) {
    return false;
  }

  if (segment === "governance") {
    const governanceSegment = queryKey[2];

    return typeof governanceSegment === "string" && PERSISTABLE_GOVERNANCE_SEGMENTS.has(governanceSegment);
  }

  if (segment === "llm") {
    const llmSegment = queryKey[2];

    return typeof llmSegment === "string" && PERSISTABLE_LLM_SEGMENTS.has(llmSegment);
  }

  if (segment === "runs") {
    const runsSegment = queryKey[2];

    return typeof runsSegment === "string" && PERSISTABLE_RUNS_SEGMENTS.has(runsSegment);
  }

  return true;
}
