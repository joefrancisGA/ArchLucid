import { buildInfrastructureAskHref } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  isInfrastructureAskNavHref,
  isInfrastructureAskOverlayEligiblePath,
} from "@/lib/infra-evidence/infrastructure-ask-overlay-path";

export const INFRASTRUCTURE_ASK_OPEN_PARAM = "infrastructureAskOpen";

export function parseInfrastructureAskOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infrastructureAskDrawerCloseHref(pathname: string, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);

  params.delete(INFRASTRUCTURE_ASK_OPEN_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
}

export function buildInfrastructureAskHandoffHref(
  pathname: string,
  currentSearch: string,
  context: Parameters<typeof buildInfrastructureAskHref>[0],
): string {
  if (!isInfrastructureAskOverlayEligiblePath(pathname)) {
    return buildInfrastructureAskHref(context);
  }

  const askHref = buildInfrastructureAskHref(context);
  const askQuery = askHref.includes("?") ? (askHref.split("?")[1] ?? "") : "";
  const params = new URLSearchParams(currentSearch);
  const askParams = new URLSearchParams(askQuery);

  askParams.forEach((value, key) => {
    params.set(key, value);
  });
  params.set(INFRASTRUCTURE_ASK_OPEN_PARAM, "1");

  const nextQuery = params.toString();

  return nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
}

/** Sidebar Ask: stay on the current workbench and open the drawer when eligible. */
export function tryResolveInfrastructureAskOverlayHref(
  navHref: string,
  pathname: string,
  currentSearch: string,
): string | null {
  if (!isInfrastructureAskNavHref(navHref)) {
    return null;
  }

  if (!isInfrastructureAskOverlayEligiblePath(pathname)) {
    return null;
  }

  const params = new URLSearchParams(currentSearch);

  params.set(INFRASTRUCTURE_ASK_OPEN_PARAM, "1");

  const nextQuery = params.toString();

  return nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname;
}
