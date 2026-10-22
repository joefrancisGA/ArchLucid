/**
 * Fixed Executive always-show tiers (IDL-06). Keys must match
 * {@link ArchLucid.ArtifactSynthesis.Compilers.ExecutiveAlwaysShowTiers} on the API.
 */
export const INFRA_DIAGRAMS_EXECUTIVE_TIERS: readonly {
  readonly key: string;
  readonly label: string;
}[] = [
  { key: "workloads", label: "Virtual machines and compute" },
  { key: "databases", label: "Databases" },
  { key: "storage", label: "Storage accounts" },
  { key: "integration", label: "Data factories" },
];

const KNOWN_EXECUTIVE_TIER_KEYS = new Set(INFRA_DIAGRAMS_EXECUTIVE_TIERS.map((tier) => tier.key));

export function isKnownInfraDiagramsExecutiveTierKey(key: string): boolean {
  return KNOWN_EXECUTIVE_TIER_KEYS.has(key.trim().toLowerCase());
}

export function parseInfraDiagramsHiddenExecutiveTierKeysFromSearch(
  raw: string | null | undefined,
): readonly string[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const seen = new Set<string>();
  const hidden: string[] = [];

  for (const token of raw.split(",")) {
    const trimmed = token.trim().toLowerCase();

    if (trimmed.length === 0 || !KNOWN_EXECUTIVE_TIER_KEYS.has(trimmed) || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    hidden.push(trimmed);
  }

  return hidden;
}

export function formatInfraDiagramsHiddenExecutiveTierKeysForSearch(
  hiddenTierKeys: readonly string[],
): string {
  const normalized = hiddenTierKeys
    .map((key) => key.trim().toLowerCase())
    .filter((key) => KNOWN_EXECUTIVE_TIER_KEYS.has(key));

  return [...new Set(normalized)].sort((left, right) => left.localeCompare(right)).join(",");
}
