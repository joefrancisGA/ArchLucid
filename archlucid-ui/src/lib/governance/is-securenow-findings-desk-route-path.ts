import {
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
  SECURENOW_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

export function isSecureNowFindingsDeskRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === SECURENOW_FINDINGS_PATH || bare === SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH;
}
