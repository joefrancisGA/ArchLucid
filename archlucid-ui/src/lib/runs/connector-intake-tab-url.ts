const CONNECTOR_INTAKE_TAB_PARAM = "intake";

export type ConnectorIntakeTabId = "terraform" | "git";

export function parseConnectorIntakeTabFromSearch(raw: string | null | undefined): ConnectorIntakeTabId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "terraform" || trimmed === "git") {
    return trimmed;
  }

  return null;
}

export function connectorIntakeTabHrefFromSearch(
  currentSearch: string,
  tab: ConnectorIntakeTabId,
  pathname: string = "/architecture/reviews/new",
): string {
  const params = new URLSearchParams(currentSearch);

  if (tab === "terraform") {
    params.delete(CONNECTOR_INTAKE_TAB_PARAM);
  } else {
    params.set(CONNECTOR_INTAKE_TAB_PARAM, tab);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
