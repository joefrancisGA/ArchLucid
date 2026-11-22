import type { components } from "@/lib/openapi-schemas";

export function compareAgentResultsResponseIsEmpty(
  data: components["schemas"]["AgentResultCompareResponse"] | undefined,
): boolean {
  if (data === undefined) {
    return false;
  }

  const rows = (data as { readonly rows?: readonly unknown[]; readonly results?: readonly unknown[] }).rows
    ?? (data as { readonly results?: readonly unknown[] }).results;

  if (Array.isArray(rows)) {
    return rows.length === 0;
  }

  return false;
}
