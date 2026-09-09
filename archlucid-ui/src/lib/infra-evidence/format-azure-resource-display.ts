export type AzureResourceDisplay = {
  readonly name: string;
  readonly resourceType: string | null;
  readonly resourceGroup: string | null;
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
};

const EMPTY_DISPLAY: AzureResourceDisplay = {
  name: "—",
  resourceType: null,
  resourceGroup: null,
  primaryLabel: "—",
  secondaryLabel: null,
};

function segmentAfterToken(segments: readonly string[], token: string): string | null {
  const index = segments.findIndex((segment) => segment.toLowerCase() === token);

  if (index < 0) {
    return null;
  }

  const value = segments[index + 1];

  if (value == null || value.length === 0) {
    return null;
  }

  return value;
}

function resourceTypeFromSegments(segments: readonly string[]): string | null {
  const providersIndex = segments.findIndex((segment) => segment.toLowerCase() === "providers");

  if (providersIndex < 0 || segments.length < providersIndex + 3) {
    return null;
  }

  // ARM ids end with .../{type}/{name}; the type segment is the one before the name.
  const typeSegment = segments[segments.length - 2];

  if (typeSegment == null || typeSegment.length === 0) {
    return null;
  }

  return typeSegment;
}

function joinSecondaryLabel(resourceType: string | null, resourceGroup: string | null): string | null {
  const parts = [resourceType, resourceGroup].filter((part): part is string => part != null && part.length > 0);

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}

/**
 * Name-first ARM display so tables do not repeat `/subscriptions/{guid}/resourceGroups/...`.
 */
export function formatAzureResourceDisplay(azureResourceId: string | null | undefined): AzureResourceDisplay {
  const trimmed = azureResourceId?.trim() ?? "";

  if (trimmed.length === 0) {
    return EMPTY_DISPLAY;
  }

  const segments = trimmed.split("/").filter((segment) => segment.length > 0);
  const name = segments[segments.length - 1] ?? trimmed;
  const resourceGroup = segmentAfterToken(segments, "resourcegroups");
  const resourceType = resourceTypeFromSegments(segments);

  return {
    name,
    resourceType,
    resourceGroup,
    primaryLabel: name,
    secondaryLabel: joinSecondaryLabel(resourceType, resourceGroup),
  };
}
