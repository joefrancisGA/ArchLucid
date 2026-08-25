import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

import { isDemoRunIdEligibleForStaticFallback } from "./eligibility";

/** Authority and pilot APIs persist runs under GUID route keys — demo slugs must not hit the live surface. */
export function isLiveAuthorityRunId(runId: string): boolean {
  return isUuidLike(runId.trim());
}

/**
 * Curated showcase spine runs (e.g. `customer-intake-modernization`) must use bundled static payloads
 * instead of run-scoped authority/governance HTTP calls.
 */
export function shouldSkipLiveAuthorityRunScopedApi(runId: string): boolean {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  return isDemoRunIdEligibleForStaticFallback(effectiveRunId);
}
