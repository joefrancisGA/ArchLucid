export const TERRAFORM_ADVISORY_EXPORT_CONFIRM_PARAM = "terraformExportConfirm";

export function parseTerraformAdvisoryExportConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function terraformAdvisoryExportConfirmHrefFromSearch(
  currentSearch: string,
  confirmOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!confirmOpen) {
    params.delete(TERRAFORM_ADVISORY_EXPORT_CONFIRM_PARAM);
  } else {
    params.set(TERRAFORM_ADVISORY_EXPORT_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
