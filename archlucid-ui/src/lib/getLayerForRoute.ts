import { NAV_GROUPS } from "@/lib/nav-config";
import { pathMatchesAiUsageSettings } from "@/lib/ai-usage-nav-paths";
import { pathMatchesCloudConnections, pathMatchesIntegrationsReadiness } from "@/lib/integrations-nav-paths";
import {
  pathMatchesLegacySettingsRoles,
  pathMatchesSettingsSecurityTrust,
  pathMatchesSettingsSupport,
  pathMatchesSettingsUsers,
} from "@/lib/settings-admin-route-paths";

/**
 * Product layer (buyer context) for operator shell — aligned with `NAV_GROUPS[].id` in `nav-config.ts` (read-only;
 * this module does not modify that file).
 */
export type LayerId = "pilot" | "operate-analysis" | "operate-governance" | "operator-admin";

function hrefToPathname(href: string): string {
  try {
    return new URL(href, "https://archlucid.invalid").pathname;
  } catch {
    return href.split("?")[0] ?? href;
  }
}

function pathMatchesPathname(pathname: string, linkPath: string): boolean {
  if (linkPath === "/") {
    return pathname === "/";
  }

  if (pathname === linkPath) {
    return true;
  }

  return pathname.startsWith(`${linkPath}/`);
}

type NavPathMatch = { groupId: LayerId; path: string; pathLength: number };

const LAYER_GROUP_ORDER: ReadonlyArray<LayerId> = [
  "pilot",
  "operate-analysis",
  "operate-governance",
  "operator-admin",
];

/** Nav groups that share the operate-analysis layer strip (advanced operations rhythm). */
const NAV_GROUP_TO_LAYER: Readonly<Record<string, LayerId>> = {
  pilot: "pilot",
  "operate-analysis": "operate-analysis",
  "operate-integrations": "operate-analysis",
  "operate-governance": "operate-governance",
  "operator-admin": "operator-admin",
  "operator-system-admin": "operator-admin",
};

const NAV_PATH_MATCHES: ReadonlyArray<NavPathMatch> = (() => {
  const rows: NavPathMatch[] = [];
  for (const g of NAV_GROUPS) {
    const layerId = NAV_GROUP_TO_LAYER[g.id];

    if (layerId === undefined) {
      continue;
    }

    for (const link of g.links) {
      const p = hrefToPathname(link.href);

      rows.push({ groupId: layerId, path: p, pathLength: p.length });
    }
  }

  // Longest nav path wins so `/governance/dashboard` beats `/governance` and `/runs/new` beats `/runs`.
  return rows
    .slice()
    .sort(
      (a, b) =>
        b.pathLength - a.pathLength
        || LAYER_GROUP_ORDER.indexOf(a.groupId) - LAYER_GROUP_ORDER.indexOf(b.groupId)
    );
})();

/**
 * Resolves the operator shell’s current product layer from a pathname (no query string) by
 * taking the **longest** `NAV_GROUPS` link path that matches, then that link’s group id.
 * Unmatched pathnames fall back to `pilot` (the default Core Pilot layer).
 */
export function getLayerForRoute(pathname: string): LayerId {
  const normalized = pathname && pathname.length > 0 ? pathname : "/";

  if (
    pathMatchesSettingsUsers(normalized)
    || pathMatchesLegacySettingsRoles(normalized)
    || pathMatchesSettingsSecurityTrust(normalized)
    || pathMatchesSettingsSupport(normalized)
  ) {
    return "operator-admin";
  }

  if (pathMatchesCloudConnections(normalized)) {
    return "operate-analysis";
  }

  if (pathMatchesIntegrationsReadiness(normalized)) {
    return "operator-admin";
  }

  if (pathMatchesAiUsageSettings(normalized)) {
    return "operator-admin";
  }

  // Nested governance pages (approval-requests, dashboard children) share the operate-governance layer
  // even when they are not exact left-nav hrefs.
  if (normalized === "/governance" || normalized.startsWith("/governance/")) {
    return "operate-governance";
  }

  for (const m of NAV_PATH_MATCHES) {
    if (pathMatchesPathname(normalized, m.path)) {
      return m.groupId;
    }
  }

  return "pilot";
}
