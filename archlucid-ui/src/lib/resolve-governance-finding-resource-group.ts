import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export type GovernanceFindingResourceGroup = {
  key: string;
  label: string;
};

const UUID_LIKE =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

const AZURE_RESOURCE_ID =
  /\/subscriptions\/[^/]+\/resourceGroups\/[^/]+\/providers\/[^/]+\/[^/]+\/[^/\s]+/i;

export function isUuidLike(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (UUID_LIKE.test(trimmed)) {
    return true;
  }

  return /^[0-9a-f]{32}$/i.test(trimmed);
}

export function extractAzureResourceIdFromText(text: string): string | null {
  const match = AZURE_RESOURCE_ID.exec(text);

  return match?.[0] ?? null;
}

/** Short label for ARM-style resource ids in grouped queue headers. */
export function shortenResourceId(resourceId: string): string {
  const trimmed = resourceId.trim();
  const providersToken = "/providers/";
  const providersIdx = trimmed.toLowerCase().indexOf(providersToken);

  if (providersIdx >= 0) {
    return trimmed.slice(providersIdx + providersToken.length);
  }

  const segments = trimmed.split("/").filter((segment) => segment.length > 0);

  if (segments.length >= 2) {
    return `${segments[segments.length - 2]}/${segments[segments.length - 1]}`;
  }

  if (trimmed.length > 48) {
    return `${trimmed.slice(0, 45)}…`;
  }

  return trimmed;
}

export function resolveGovernanceFindingResourceGroup(
  row: GovernanceFindingQueueRow,
): GovernanceFindingResourceGroup {
  const resourceId = row.resourceId?.trim() ?? "";

  if (resourceId.length > 0) {
    return {
      key: `resource:${resourceId}`,
      label: shortenResourceId(resourceId),
    };
  }

  const extracted = extractAzureResourceIdFromText(row.title);

  if (extracted !== null) {
    return {
      key: `resource:${extracted}`,
      label: shortenResourceId(extracted),
    };
  }

  const systemName = row.systemName?.trim() ?? "";

  if (systemName.length > 0) {
    return {
      key: `system:${systemName}`,
      label: systemName,
    };
  }

  const runLabel = row.runLabel.trim();

  if (runLabel.length > 0 && runLabel !== " — " && !isUuidLike(runLabel)) {
    return {
      key: `review:${runLabel}`,
      label: runLabel,
    };
  }

  const category = row.category.trim();

  if (category.length > 0 && category !== " — ") {
    return {
      key: `category:${category}`,
      label: category,
    };
  }

  return {
    key: "unassigned",
    label: "Unassigned resource context",
  };
}
