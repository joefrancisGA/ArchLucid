import { CANONICAL_GET_STARTED_PATH } from "@/lib/legacy-quick-start-route";

/**

 * Builds `/get-started` plus the same query string as the incoming legacy quick-start shim

 * so bookmarks and handoffs keep deep-link params, including repeated keys.

 */

export function buildQuickStartRedirectPath(

  searchParams: Record<string, string | string[] | undefined>,

): string {

  const u = new URL("http://local");

  u.pathname = CANONICAL_GET_STARTED_PATH;

  for (const [key, value] of Object.entries(searchParams)) {

    if (value === undefined) {

      continue;

    }

    if (Array.isArray(value)) {

      for (const entry of value) {

        u.searchParams.append(key, entry);

      }

    } else {

      u.searchParams.set(key, value);

    }

  }

  return `${u.pathname}${u.search}`;

}

