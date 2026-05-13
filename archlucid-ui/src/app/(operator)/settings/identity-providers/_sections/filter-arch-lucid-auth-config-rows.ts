import type { components } from "@/lib/api-types.generated";

type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

export function filterArchLucidAuthConfigRows(keys: ConfigSummaryKeyRow[]): ConfigSummaryKeyRow[] {
  return keys.filter((k) => (k.configPath ?? "").startsWith("ArchLucidAuth:"));
}
