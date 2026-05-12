import type { VersionInfoResponse } from "@/lib/health-dashboard-types";

/** Hides raw version strings when build metadata uses internal E2E-style labels. */
export function isInternalTestBuildVersion(version: VersionInfoResponse | null): boolean {
  if (version === null) {
    return false;
  }

  return (
    Boolean(version.informationalVersion?.toLowerCase().includes("e2e")) ||
    Boolean(version.commitSha?.toLowerCase().startsWith("e2e"))
  );
}
