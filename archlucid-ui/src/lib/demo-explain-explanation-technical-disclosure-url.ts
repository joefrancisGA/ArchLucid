export const DEMO_EXPLAIN_EXPLANATION_TECHNICAL_OPEN_PARAM = "demoExplainExplanationTechnicalOpen";

export function parseDemoExplainExplanationTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function demoExplainExplanationTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(DEMO_EXPLAIN_EXPLANATION_TECHNICAL_OPEN_PARAM);
  } else {
    params.set(DEMO_EXPLAIN_EXPLANATION_TECHNICAL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
