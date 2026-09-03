import type { ConnectorPurposeGroupId } from "@/lib/connector-operations-present";
import { CONNECTOR_PURPOSE_GROUPS } from "@/lib/connector-operations-present";
import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";

export const CONNECTOR_OPERATIONS_CATEGORY_PARAM = "category";

const CONNECTOR_OPERATIONS_CATEGORY_IDS = new Set<string>(
  CONNECTOR_PURPOSE_GROUPS.map((group) => group.id),
);

export function parseConnectorOperationsCategoryFromSearch(
  raw: string | null | undefined,
): ConnectorPurposeGroupId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!CONNECTOR_OPERATIONS_CATEGORY_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as ConnectorPurposeGroupId;
}

export function connectorOperationsCategoryHrefFromSearch(
  currentSearch: string,
  category: ConnectorPurposeGroupId | null,
  pathname: string = ADMINISTRATION_CONNECTION_STATUS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (category === null) {
    params.delete(CONNECTOR_OPERATIONS_CATEGORY_PARAM);
  } else {
    params.set(CONNECTOR_OPERATIONS_CATEGORY_PARAM, category);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
