import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";

/**
 * Builds canonical architecture scorecard path plus the legacy `/scorecard` shim query string
 * so sample mode and other deep-link params survive the redirect.
 */
export function buildScorecardRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH;

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        u.searchParams.append(key, entry);
      }
    } else {
      u.searchParams.set(key, value);
    }
  }

  return `${u.pathname}${u.search}`;
}
