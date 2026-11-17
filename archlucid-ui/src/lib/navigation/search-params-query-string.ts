import type { ReadonlyURLSearchParams } from "next/navigation";

import { readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

/** Canonical query string for URL href writes from App Router search params. */
export function searchParamsQueryStringForHrefWrite(searchParams: ReadonlyURLSearchParams): string {
  try {
    return searchParams.toString();
  } catch {
    return readWindowLocationSearch();
  }
}

/** Read one search param for URL-driven UI state (popstate / disclosure sync). */
export function searchParamFromRouterSearchParams(
  searchParams: ReadonlyURLSearchParams,
  param: string,
): string | null {
  try {
    return searchParams.get(param);
  } catch {
    return new URLSearchParams(readWindowLocationSearch()).get(param);
  }
}
