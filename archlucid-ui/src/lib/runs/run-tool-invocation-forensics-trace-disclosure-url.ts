import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_TOOL_INVOCATION_FORENSICS_TRACE_ID_PARAM = "runToolInvocationForensicsTraceId";

export function parseRunToolInvocationForensicsTraceIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function runToolInvocationForensicsTraceDisclosureHrefFromSearch(
  currentSearch: string,
  traceId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (traceId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(RUN_TOOL_INVOCATION_FORENSICS_TRACE_ID_PARAM);
    } else {
      params.set(RUN_TOOL_INVOCATION_FORENSICS_TRACE_ID_PARAM, trimmed);
    }
    },
  });
}
