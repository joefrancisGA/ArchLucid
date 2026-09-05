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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_GOV_APPROVAL_TECH_REF_OPEN_PARAM);
  } else {
    params.set(HELP_GOV_APPROVAL_TECH_REF_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
