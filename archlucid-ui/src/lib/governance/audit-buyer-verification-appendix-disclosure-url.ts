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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(AUDIT_BUYER_VERIFICATION_APPENDIX_OPEN_PARAM);
  } else {
    params.set(AUDIT_BUYER_VERIFICATION_APPENDIX_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
