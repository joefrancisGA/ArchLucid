import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
import { parseRemediationFactoryDisclosureOpenFromSearch } from "@/lib/remediation-factory/remediation-factory-url-state";

export const REMEDIATION_FACTORY_SNAPSHOT_IDENTITY_DISCLOSURE_OPEN_PARAM =
  "remediationFactorySnapshotIdentityOpen";

export function parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  return parseRemediationFactoryDisclosureOpenFromSearch(raw);
}

export function remediationFactorySnapshotIdentityDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REMEDIATION_FACTORY_SNAPSHOT_IDENTITY_DISCLOSURE_OPEN_PARAM);
}