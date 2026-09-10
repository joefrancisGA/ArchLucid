export const INFRA_ASK_SIMULATOR_DISCLOSURE_OPEN_PARAM = "infraAskSimulatorDisclosureOpen";

export const INFRA_ASK_SIMULATOR_PARAM = "infraAskSimulator";

export function parseInfraAskSimulatorFromSearch(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "0" || trimmed === "false") {
    return false;
  }

  if (trimmed === "1" || trimmed === "true") {
    return true;
  }

  return null;
}

export function infraAskSimulatorModeHrefFromSearch(
  currentSearch: string,
  useSimulator: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (useSimulator) {
    params.set(INFRA_ASK_SIMULATOR_PARAM, "1");
  } else {
    params.set(INFRA_ASK_SIMULATOR_PARAM, "0");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function parseInfraAskSimulatorDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraAskSimulatorDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(INFRA_ASK_SIMULATOR_DISCLOSURE_OPEN_PARAM);
  } else {
    params.set(INFRA_ASK_SIMULATOR_DISCLOSURE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
