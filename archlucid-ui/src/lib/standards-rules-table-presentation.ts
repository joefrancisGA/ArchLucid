import type { EnterpriseStatusKind } from "@/lib/design-tokens";

/** Maps policy enforcement mode strings to enterprise status tag semantics. */
export function standardsRuleEnforcementStatusKind(enforcementMode: string): EnterpriseStatusKind {
  const normalized = enforcementMode.trim().toLowerCase();

  if (normalized === "required" || normalized === "mandatory" || normalized === "blocking") {
    return "needs-attention";
  }

  if (normalized === "advisory" || normalized === "optional" || normalized === "informational") {
    return "neutral";
  }

  return "neutral";
}

export function standardsRulesFiltersAreActive(
  filters: {
    readonly searchQuery: string;
    readonly standardFramework: string;
    readonly severity: string;
    readonly enforcementMode: string;
    readonly sourcePolicyPack: string;
    readonly linkedFindings: string;
  },
): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    filters.standardFramework !== "all" ||
    filters.severity !== "all" ||
    filters.enforcementMode !== "all" ||
    filters.sourcePolicyPack !== "all" ||
    filters.linkedFindings !== "all"
  );
}
