export const INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM = "infraRemediationVerifyHintDisclosureOpen";

export function parseInfraRemediationVerifyHintDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraRemediationVerifyHintDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM);
  } else {
    params.set(INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
