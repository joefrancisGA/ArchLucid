import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, confirmOpen, pathname, TERRAFORM_ADVISORY_EXPORT_CONFIRM_PARAM);
}
