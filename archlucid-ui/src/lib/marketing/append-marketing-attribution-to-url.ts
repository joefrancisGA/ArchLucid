import { MARKETING_ATTRIBUTION_QUERY_KEYS } from "@/lib/marketing/attribution-query-keys";
import type { ReadonlyURLSearchParams } from "next/navigation";

/**
 * Merges current page attribution params into the target URL (overwrites same keys on the base URL).
 */
export function appendMarketingAttributionToUrl(
  absoluteOrRelativeBaseUrl: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  pageOrigin: string,
): string {
  let url: URL;

  try {
    url = new URL(absoluteOrRelativeBaseUrl, pageOrigin);
  } catch {
    return absoluteOrRelativeBaseUrl;
  }

  for (const key of MARKETING_ATTRIBUTION_QUERY_KEYS) {
    const raw: string | null = searchParams.get(key);

    if (raw !== null && raw.trim() !== "") url.searchParams.set(key, raw.trim());
  }

  return url.href;
}
