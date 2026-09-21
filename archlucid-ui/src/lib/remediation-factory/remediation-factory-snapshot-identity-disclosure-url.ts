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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(REMEDIATION_FACTORY_SNAPSHOT_IDENTITY_DISCLOSURE_OPEN_PARAM);
  } else {
    params.set(REMEDIATION_FACTORY_SNAPSHOT_IDENTITY_DISCLOSURE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
