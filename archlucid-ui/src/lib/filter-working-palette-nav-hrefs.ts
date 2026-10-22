import { navHrefPathPart } from "@/lib/nav-href-path-part";
import {
  classifyWorkingRoutePathname,
  isWorkingPaletteNavRole,
  normalizeRoutePathname,
} from "@/lib/routing/working-route-roles";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";

/** Help destinations reachable from Working palette even when absent from sidebar rows. */
export const WORKING_PALETTE_HELP_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  "/help",
  "/help/report-problem",
]);

/** Working pilot destinations classified as evalAdmin but still palette-safe (AO-41). */
export const WORKING_PALETTE_EVAL_ADMIN_ALLOWLIST: ReadonlySet<string> = new Set<string>([
  SIGNED_RECORDS_LIST_PATH,
  SPONSOR_DASHBOARD_HREF,
]);

export function isWorkingPaletteNavHrefAllowed(href: string): boolean {
  const path = normalizeRoutePathname(navHrefPathPart(href));

  if (WORKING_PALETTE_HELP_ALLOWLIST.has(path)) {
    return true;
  }

  if (WORKING_PALETTE_EVAL_ADMIN_ALLOWLIST.has(path)) {
    return true;
  }

  const role = classifyWorkingRoutePathname(path);

  if (role === null) {
    return false;
  }

  return isWorkingPaletteNavRole(role, path);
}

export function filterWorkingPaletteNavHrefs(hrefs: ReadonlySet<string>): Set<string> {
  const filtered = new Set<string>();

  for (const href of hrefs) {
    if (isWorkingPaletteNavHrefAllowed(href)) {
      filtered.add(href);
    }
  }

  return filtered;
}
