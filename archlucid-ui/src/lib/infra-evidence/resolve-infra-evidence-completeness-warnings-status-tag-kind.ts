import type { EnterpriseStatusKind } from "@/lib/design-tokens";

const COMPLETENESS_WARNING_BLOCKED_PREFIXES = [
  "rbac-scope-too-broad:",
  "rbac-role-unmapped:",
] as const;

/** Maps completeness warning codes to a StatusTag severity for the banner header. */
export function resolveInfraEvidenceCompletenessWarningsStatusTagKind(
  warnings: readonly string[],
): EnterpriseStatusKind {
  const normalized = warnings
    .map((warning) => warning.trim().toLowerCase())
    .filter((warning) => warning.length > 0);

  if (normalized.length === 0) {
    return "needs-attention";
  }

  const hasBlocked = normalized.some((warning) =>
    COMPLETENESS_WARNING_BLOCKED_PREFIXES.some((prefix) => warning.startsWith(prefix)),
  );

  if (hasBlocked) {
    return "blocked";
  }

  return "needs-attention";
}
