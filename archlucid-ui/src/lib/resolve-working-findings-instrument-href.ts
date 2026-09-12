import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";

export type ResolveWorkingFindingsInstrumentHrefInput = {
  readonly architectureId?: string | null;
  readonly runId?: string | null;
  readonly filter?: RiskRegisterFilter;
  readonly isWorkingMode: boolean;
};

/** ADR 0098 / SG-019 — nested architecture findings when parent known on Working. */
export function resolveWorkingFindingsInstrumentHref(
  input: ResolveWorkingFindingsInstrumentHrefInput,
): string {
  const architectureId = input.architectureId?.trim() ?? "";
  const runId = input.runId?.trim() ?? "";

  if (input.isWorkingMode && architectureId.length > 0) {
    const params = new URLSearchParams();

    if (runId.length > 0) {
      params.set("runId", runId);
    }

    if (input.filter !== undefined && input.filter !== "all") {
      params.set("filter", input.filter);
    }

    const query = params.toString();
    const base = architectureNestedFindingsPath(architectureId);

    return query.length > 0 ? `${base}?${query}` : base;
  }

  return buildGovernanceFindingsQueueHref({ runId, filter: input.filter });
}
