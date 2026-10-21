import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const PIPELINE_TIMELINE_EVENT_ID_PARAM = "pipelineTimelineEventId";

export function parsePipelineTimelineEventIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function pipelineTimelineEventDisclosureHrefFromSearch(
  currentSearch: string,
  eventId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (eventId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(PIPELINE_TIMELINE_EVENT_ID_PARAM);
    } else {
      params.set(PIPELINE_TIMELINE_EVENT_ID_PARAM, trimmed);
    }
    },
  });
}
