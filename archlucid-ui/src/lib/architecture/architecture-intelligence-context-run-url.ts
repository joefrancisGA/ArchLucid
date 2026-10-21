import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (contextRunId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(ARCHITECTURE_INTELLIGENCE_CONTEXT_RUN_PARAM);
    } else {
      params.set(ARCHITECTURE_INTELLIGENCE_CONTEXT_RUN_PARAM, trimmed);
    }
    },
  });
}
