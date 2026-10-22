import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, DEMO_EXPLAIN_EXPLANATION_TECHNICAL_OPEN_PARAM);
}
