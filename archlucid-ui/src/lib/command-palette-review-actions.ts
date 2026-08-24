import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import type { CommandPaletteAction } from "@/lib/command-palette-actions";

/** Contextual review actions for the command palette when a run id is in scope. */
export function buildCommandPaletteReviewActions(runId: string | null): readonly CommandPaletteAction[] {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return [];
  }

  const encoded = encodeURIComponent(trimmed);

  return [
    {
      id: "action-compare-this-review",
      label: "Compare this review",
      href: comparePageHrefAdaptive(trimmed),
      searchValue: "action compare review delta prior later",
    },
    {
      id: "action-replay-this-review",
      label: "Validate this review",
      href: `${INTERNAL_REPLAY_PATH}?runId=${encoded}`,
      searchValue: "action replay validate review authority",
    },
    {
      id: "action-sponsor-report-this-review",
      label: "Open sponsor report for this review",
      href: `${SPONSOR_REPORT_PATH}?runId=${encoded}`,
      searchValue: "action sponsor executive report export",
    },
  ];
}
