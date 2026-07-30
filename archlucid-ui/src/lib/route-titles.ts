import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { isInvalidDynamicRouteToken } from "@/lib/route-dynamic-param";
import { ROUTE_TITLES } from "@/lib/route-static-titles";

/** Human-readable title for route announcements and accessibility copy. */
export function getRouteTitle(pathname: string): string {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (ROUTE_TITLES[normalized] !== undefined) {
    return ROUTE_TITLES[normalized];
  }

  if (/^\/reviews\/[^/]+$/.test(normalized)) {
    return "Review detail";
  }

  if (/^\/architectures\/[^/]+$/.test(normalized)) {
    return CREATE_ARCHITECTURE_LABEL;
  }

  if (/^\/signed-records\/[^/]+$/.test(normalized)) {
    return "Signed review record";
  }

  if (/^\/governance\/policy-packs\/[^/]+$/.test(normalized)) {
    const tail = normalized.split("/").filter((s) => s.length > 0).pop() ?? "";

    if (isInvalidDynamicRouteToken(tail)) {
      return "Not found";
    }

    return "Policy pack detail";
  }

  const segments: string[] = normalized.split("/").filter((s) => s.length > 0);
  const last: string = segments.length > 0 ? segments[segments.length - 1] : "Page";

  if (last.length === 0) {
    return "Page";
  }

  if (last === "itsm") {
    return normalized === "/admin/integrations/itsm" ? "ITSM connectors" : "ITSM";
  }

  return last.charAt(0).toUpperCase() + last.slice(1).replaceAll("-", " ");
}
