import { CANONICAL_GRAPH_PATH } from "@/lib/legacy-architecture-graph-route";

/**
 * Builds {@link CANONICAL_GRAPH_PATH} plus the same query string as the incoming legacy Operate
 * architecture-graph bookmark so handoffs keep deep-link params such as `runId`.
 */
export function buildGraphRedirectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const u = new URL("http://local");
  u.pathname = CANONICAL_GRAPH_PATH;

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
