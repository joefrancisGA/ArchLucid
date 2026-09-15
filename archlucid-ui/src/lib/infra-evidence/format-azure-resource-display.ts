export type AzureResourceDisplay = {
  readonly name: string;
  readonly resourceType: string | null;
  readonly resourceGroup: string | null;
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
};

export type CloudResourceDisplayNameInput = {
  readonly displayName?: string | null;
  readonly externalResourceId: string;
};

const EMPTY_RESOURCE_NAME_PLACEHOLDER = "—";

/**
 * SecureNow lists and diagrams show Azure resource names in lowercase for scanability.
 * Storage keeps the cloud provider casing; normalization is display-only.
 */
export function normalizeSecureNowResourceNameForDisplay(resourceName: string): string {
  const trimmed = resourceName.trim();

  if (trimmed.length === 0 || trimmed === EMPTY_RESOURCE_NAME_PLACEHOLDER) {
    return trimmed.length > 0 ? trimmed : EMPTY_RESOURCE_NAME_PLACEHOLDER;
  }

  return trimmed.toLowerCase();
}

export function formatCloudResourceDisplayName(input: CloudResourceDisplayNameInput): string {
  const displayName = input.displayName?.trim() ?? "";

  if (displayName.length > 0) {
    return normalizeSecureNowResourceNameForDisplay(displayName);
  }

  const segments = input.externalResourceId.split("/");
  const fallbackName = segments[segments.length - 1] ?? input.externalResourceId;

  return normalizeSecureNowResourceNameForDisplay(fallbackName);
}

const EMPTY_DISPLAY: AzureResourceDisplay = {
  name: EMPTY_RESOURCE_NAME_PLACEHOLDER,
  resourceType: null,
  resourceGroup: null,
  primaryLabel: EMPTY_RESOURCE_NAME_PLACEHOLDER,
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

function stripMicrosoftProviderPrefix(namespace: string): string {
  const prefix = "microsoft.";

  if (namespace.toLowerCase().startsWith(prefix)) {
    return namespace.slice("Microsoft.".length);
  }

  return namespace;
}

/**
 * Table type column: drop the Azure `Microsoft.` provider prefix so
 * `Microsoft.Network/publicIPAddresses` reads as `Network/publicIPAddresses`.
 */
export function formatAzureResourceTypeForDisplay(resourceType: string | null | undefined): string {
  if (resourceType == null) {
    return "—";
  }

  const trimmed = resourceType.trim();

  if (trimmed.length === 0) {
    return "—";
  }

  const slashIndex = trimmed.indexOf("/");
  const namespace = slashIndex >= 0 ? trimmed.slice(0, slashIndex) : trimmed;
  const remainder = slashIndex >= 0 ? trimmed.slice(slashIndex) : "";

  return `${stripMicrosoftProviderPrefix(namespace)}${remainder}`;
}

function resourceTypeFromSegments(segments: readonly string[]): string | null {
  const providersIndex = segments.findIndex((segment) => segment.toLowerCase() === "providers");

  if (providersIndex < 0 || segments.length < providersIndex + 3) {
    return null;
  }

  const namespaceSegment = segments[providersIndex + 1];

  if (namespaceSegment == null || namespaceSegment.length === 0) {
    return null;
  }

  const typeSegments: string[] = [];

  for (let index = providersIndex + 2; index <= segments.length - 2; index += 2) {
    const typeSegment = segments[index];

    if (typeSegment == null || typeSegment.length === 0) {
      return null;
    }

    typeSegments.push(typeSegment);
  }

  if (typeSegments.length === 0) {
    return null;
  }

  return `${stripMicrosoftProviderPrefix(namespaceSegment)}/${typeSegments.join("/")}`;
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

  const displayName = normalizeSecureNowResourceNameForDisplay(name);

  return {
    name: displayName,
    resourceType,
    resourceGroup,
    primaryLabel: displayName,
    secondaryLabel: joinSecondaryLabel(resourceType, resourceGroup),
  };
}
