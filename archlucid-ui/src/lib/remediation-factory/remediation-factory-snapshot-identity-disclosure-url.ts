import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REMEDIATION_FACTORY_SNAPSHOT_IDENTITY_DISCLOSURE_OPEN_PARAM =
  "remediationFactorySnapshotIdentityOpen";

export function parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function remediationFactorySnapshotIdentityDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REMEDIATION_FACTORY_SNAPSHOT_IDENTITY_DISCLOSURE_OPEN_PARAM);
}
