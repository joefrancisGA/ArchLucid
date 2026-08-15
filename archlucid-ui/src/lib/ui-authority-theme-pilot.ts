import { resolveAuthorityThemeFromEnv } from "@/lib/ui-authority-theme";

/**
 * TB-2281 — bounded charcoal authority theme on sponsor, trust, and sealed-record surfaces.
 * Default-on for pilot cohort; set `NEXT_PUBLIC_UI_AUTHORITY_THEME_PILOT=0` to roll back without redeploying routes.
 */
export function isUiAuthorityThemePilotSurfacesEnabled(): boolean {
  const pilotRaw = (process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME_PILOT ?? "1").trim().toLowerCase();

  if (pilotRaw === "0" || pilotRaw === "false") {
    return false;
  }

  if (pilotRaw === "1" || pilotRaw === "true") {
    return true;
  }

  return resolveAuthorityThemeFromEnv(process.env.NEXT_PUBLIC_UI_AUTHORITY_THEME) === "charcoal";
}

export const UI_AUTHORITY_THEME_PILOT_ROUTE_PREFIXES = [
  "/architecture/sponsor-dashboard",
  "/insights/sponsor-report",
  "/governance/sealed-records",
  "/assurance-status",
  "/administration/security-trust",
] as const;

export function isUiAuthorityThemePilotRoute(pathname: string): boolean {
  const normalized = pathname.trim().toLowerCase();

  return UI_AUTHORITY_THEME_PILOT_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
