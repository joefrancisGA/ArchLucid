import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const AWS_CLOUD_CONNECTION_SOURCES_OPEN_PARAM = "awsCloudConnectionSourcesOpen";

export function parseAwsCloudConnectionSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function awsCloudConnectionSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, AWS_CLOUD_CONNECTION_SOURCES_OPEN_PARAM);
}
