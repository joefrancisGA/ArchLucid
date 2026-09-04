import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";

export const ARCHITECTURE_INTELLIGENCE_CONTEXT_RUN_PARAM = "contextRunId";

export function parseArchitectureIntelligenceContextRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function architectureIntelligenceContextRunHrefFromSearch(
  currentSearch: string,
  contextRunId: string | null,
  pathname: string = ARCHITECTURE_INTELLIGENCE_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (contextRunId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ARCHITECTURE_INTELLIGENCE_CONTEXT_RUN_PARAM);
  } else {
    params.set(ARCHITECTURE_INTELLIGENCE_CONTEXT_RUN_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
