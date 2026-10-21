import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM = "infraResourceRowArmIdDisclosureKey";

export function parseInfraResourceRowArmIdDisclosureKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function infraResourceRowArmIdDisclosureHrefFromSearch(
  currentSearch: string,
  cloudResourceId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (cloudResourceId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM);
    } else {
      params.set(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM, trimmed);
    }
    },
  });
}

/** Persists row ARM id disclosure in the address bar without a Next.js soft navigation. */
export function writeInfraResourceRowArmIdDisclosureKeyToUrl(cloudResourceId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const trimmed = (cloudResourceId ?? "").trim();

  if (trimmed.length === 0) {
    url.searchParams.delete(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM);
  } else {
    url.searchParams.set(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM, trimmed);
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}
