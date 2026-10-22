import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_GOV_APPROVAL_TECH_REF_OPEN_PARAM = "helpGovApprovalTechRef";

export function parseHelpGovApprovalTechRefOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpGovApprovalTechnicalReferenceHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_GOV_APPROVAL_TECH_REF_OPEN_PARAM);
}
