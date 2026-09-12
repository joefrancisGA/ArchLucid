export const INFRA_DIAGRAMS_RESOURCE_GROUP_MODE = "resourceGroup";

export const INFRA_DIAGRAMS_FULL_MACHINE_FALLBACK_KEY = "full-machine";

export const INFRA_DIAGRAMS_RESOURCE_GROUP_KEY_PREFIX = "resourceGroup:";

export const INFRA_DIAGRAMS_RESOURCE_GROUP_MAP_VIEW_MARKER = "al-view=resource-group-map";

const THEMATIC_PARTITION_KEYS = new Set(["executive", "network", "identity", "data", "cross-boundary"]);

export function isInfraDiagramsResourceGroupMode(mode: string): boolean {
  return mode.trim() === INFRA_DIAGRAMS_RESOURCE_GROUP_MODE;
}

export function isInfraDiagramsFullMachineFallbackKey(key: string): boolean {
  return key.trim().toLowerCase() === INFRA_DIAGRAMS_FULL_MACHINE_FALLBACK_KEY;
}

export function isInfraDiagramsThematicPartitionKey(key: string): boolean {
  return THEMATIC_PARTITION_KEYS.has(key.trim());
}

export function parseInfraDiagramsResourceGroupName(viewKey: string): string {
  const trimmed = viewKey.trim();

  if (trimmed.length === 0 || isInfraDiagramsThematicPartitionKey(trimmed) || isInfraDiagramsFullMachineFallbackKey(trimmed)) {
    return "";
  }

  if (trimmed.startsWith(INFRA_DIAGRAMS_RESOURCE_GROUP_KEY_PREFIX)) {
    return trimmed.slice(INFRA_DIAGRAMS_RESOURCE_GROUP_KEY_PREFIX.length).trim();
  }

  return trimmed;
}

export function buildInfraDiagramsResourceGroupModeToken(resourceGroupName: string): string {
  const name = resourceGroupName.trim();

  if (name.length === 0) {
    return INFRA_DIAGRAMS_RESOURCE_GROUP_MODE;
  }

  return `${INFRA_DIAGRAMS_RESOURCE_GROUP_KEY_PREFIX}${name}`;
}

export function isInfraEvidenceResourceGroupMapMermaid(mermaidSource: string): boolean {
  return mermaidSource.includes(INFRA_DIAGRAMS_RESOURCE_GROUP_MAP_VIEW_MARKER);
}
