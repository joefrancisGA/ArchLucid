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
