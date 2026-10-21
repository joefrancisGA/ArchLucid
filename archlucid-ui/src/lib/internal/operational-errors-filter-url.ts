import { INTERNAL_OPERATIONAL_ERRORS_PATH } from "@/lib/internal-ops-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const OPERATIONAL_ERRORS_CATEGORY_PARAM = "category";
export const OPERATIONAL_ERRORS_STATUS_PARAM = "status";
export const OPERATIONAL_ERRORS_TENANT_PARAM = "tenant";
export const OPERATIONAL_ERRORS_CORRELATION_PARAM = "correlation";

const CATEGORY_IDS = new Set<string>(["HttpError", "DatabaseError", "UnhandledException"]);
const STATUS_IDS = new Set<string>(["400", "500"]);

export function parseOperationalErrorsCategoryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!CATEGORY_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed;
}

export function parseOperationalErrorsStatusFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!STATUS_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed;
}

export function operationalErrorsCategoryHrefFromSearch(
  currentSearch: string,
  category: string,
  pathname: string = INTERNAL_OPERATIONAL_ERRORS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (category === "all") {
      params.delete(OPERATIONAL_ERRORS_CATEGORY_PARAM);
    } else {
      params.set(OPERATIONAL_ERRORS_CATEGORY_PARAM, category);
    }
    },
  });
}

export function operationalErrorsStatusHrefFromSearch(
  currentSearch: string,
  status: string,
  pathname: string = INTERNAL_OPERATIONAL_ERRORS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (status === "all") {
      params.delete(OPERATIONAL_ERRORS_STATUS_PARAM);
    } else {
      params.set(OPERATIONAL_ERRORS_STATUS_PARAM, status);
    }
    },
  });
}

export function parseOperationalErrorsTenantFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseOperationalErrorsCorrelationFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function operationalErrorsTenantHrefFromSearch(
  currentSearch: string,
  tenant: string,
  pathname: string = INTERNAL_OPERATIONAL_ERRORS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = tenant.trim();

    if (trimmed.length === 0) {
      params.delete(OPERATIONAL_ERRORS_TENANT_PARAM);
    } else {
      params.set(OPERATIONAL_ERRORS_TENANT_PARAM, trimmed);
    }
    },
  });
}

export function operationalErrorsCorrelationHrefFromSearch(
  currentSearch: string,
  correlation: string,
  pathname: string = INTERNAL_OPERATIONAL_ERRORS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = correlation.trim();

    if (trimmed.length === 0) {
      params.delete(OPERATIONAL_ERRORS_CORRELATION_PARAM);
    } else {
      params.set(OPERATIONAL_ERRORS_CORRELATION_PARAM, trimmed);
    }
    },
  });
}
