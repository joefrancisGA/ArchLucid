import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_INSPECT_TYPED_PAYLOAD_OPEN_PARAM = "findingInspectTypedPayloadOpen";

export function parseFindingInspectTypedPayloadOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingInspectTypedPayloadDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDING_INSPECT_TYPED_PAYLOAD_OPEN_PARAM);
}
