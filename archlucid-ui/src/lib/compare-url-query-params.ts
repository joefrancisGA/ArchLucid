import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** How `/compare` URLs encode the prior vs later run id in the query string. */
export type CompareHrefQueryMode = "friendly" | "technical";

const PRIOR_QUERY_KEYS_ORDERED = ["leftRunId", "fromRunId", "priorRunId", "baselineRunId"] as const;
const LATER_QUERY_KEYS_ORDERED = ["rightRunId", "laterRunId", "targetRunId"] as const;

function pickFirstSearchParam(
  get: (key: string) => string | null | undefined,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const raw = get(key)?.trim() ?? "";

    if (raw.length > 0) {
      return raw;
    }
  }

  return "";
}

/** Accepts canonical and buyer-friendly query keys; first non-empty value wins per side. */
export function readCompareRunIdsFromSearchParams(searchParams: Pick<URLSearchParams, "get">): {
  readonly prior: string;
  readonly later: string;
} {
  return {
    prior: pickFirstSearchParam((k) => searchParams.get(k), PRIOR_QUERY_KEYS_ORDERED),
    later: pickFirstSearchParam((k) => searchParams.get(k), LATER_QUERY_KEYS_ORDERED),
  };
}

/**
 * Builds `/compare?…` with either friendly (`priorRunId`/`laterRunId`) or technical (`leftRunId`/`rightRunId`) keys.
 * Empty `laterRunId` omits the second parameter (picker prefill-only links).
 */
export function comparePageHref(
  priorRunId: string,
  laterRunId: string | null | undefined,
  mode: CompareHrefQueryMode,
): string {
  const prior = priorRunId.trim();
  const later = laterRunId?.trim() ?? "";
  const qs = new URLSearchParams();

  if (mode === "friendly") {
    qs.set("priorRunId", prior);

    if (later.length > 0) {
      qs.set("laterRunId", later);
    }

    return `/compare?${qs.toString()}`;
  }

  qs.set("leftRunId", prior);

  if (later.length > 0) {
    qs.set("rightRunId", later);
  }

  return `/compare?${qs.toString()}`;
}

/** Friendly query names in buyer-polished builds; technical names in full-operator mode. */
export function comparePageHrefAdaptive(priorRunId: string, laterRunId?: string | null): string {
  return comparePageHref(
    priorRunId,
    laterRunId,
    isBuyerPolishedOperatorShellEnv() ? "friendly" : "technical",
  );
}
