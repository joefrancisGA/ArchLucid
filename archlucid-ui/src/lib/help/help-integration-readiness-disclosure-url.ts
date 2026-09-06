import { INTEGRATION_READINESS_HELP_CANONICAL_PATH } from "@/lib/integration-readiness-help-evidence-copy";

export const HELP_INTEGRATION_READINESS_STATUS_GLOSSARY_OPEN_PARAM = "helpIntegrationReadinessStatusGlossaryOpen";

export function parseHelpIntegrationReadinessStatusGlossaryOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpIntegrationReadinessStatusGlossaryDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = INTEGRATION_READINESS_HELP_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_INTEGRATION_READINESS_STATUS_GLOSSARY_OPEN_PARAM);
  } else {
    params.set(HELP_INTEGRATION_READINESS_STATUS_GLOSSARY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
