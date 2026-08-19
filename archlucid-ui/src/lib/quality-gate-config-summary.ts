import type { components } from "@/lib/api-types.generated";

export type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

/** Catalog paths surfaced on Tenant settings (“Quality Gates” panel). */
export const agentOutputQualityGateConfigPaths = {
  mode: "ArchLucid:AgentOutput:QualityGate:Mode",
  structuralWarnBelow: "ArchLucid:AgentOutput:QualityGate:StructuralWarnBelow",
  semanticWarnBelow: "ArchLucid:AgentOutput:QualityGate:SemanticWarnBelow",
} as const;

export type QualityGateEffectiveRow = {
  readonly label: string;
  readonly row: ConfigSummaryKeyRow | null;
};

/** Picks Mode / StructuralWarnBelow / SemanticWarnBelow rows from admin config-summary by catalog path (stable order). */
export function selectAgentOutputQualityGateRows(keys: readonly ConfigSummaryKeyRow[] | null | undefined): QualityGateEffectiveRow[] {
  if (keys == null) {
    return [
      { label: "Mode", row: null },
      { label: "StructuralWarnBelow", row: null },
      { label: "SemanticWarnBelow", row: null },
    ];
  }

  const byPath = new Map<string, ConfigSummaryKeyRow>();

  for (const row of keys) {
    const p = row.configPath?.trim();

    if (p == null || p.length === 0) {
      continue;
    }

    byPath.set(p, row);
  }

  const pick = (path: string, label: string): QualityGateEffectiveRow => ({
    label,
    row: byPath.get(path) ?? null,
  });

  return [
    pick(agentOutputQualityGateConfigPaths.mode, "Mode"),
    pick(agentOutputQualityGateConfigPaths.structuralWarnBelow, "StructuralWarnBelow"),
    pick(agentOutputQualityGateConfigPaths.semanticWarnBelow, "SemanticWarnBelow"),
  ];
}
