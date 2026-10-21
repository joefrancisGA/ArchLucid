import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AUDIT_BUYER_VERIFICATION_APPENDIX_OPEN_PARAM = "auditBuyerVerificationAppendixOpen";

export function parseAuditBuyerVerificationAppendixOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function auditBuyerVerificationAppendixDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AUDIT_BUYER_VERIFICATION_APPENDIX_OPEN_PARAM);
}
