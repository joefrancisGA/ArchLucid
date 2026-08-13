import { getRunExplanationSummary, listRunsByProjectPaged } from "@/lib/api";
import {
  getArchitectureDecisionRegister,
  getArchitectureRiskRegister,
} from "@/lib/api/governance-stickiness-api";
import type { RunSummary } from "@/types/authority";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  staticDemoGovernanceFindingRows,
} from "@/components/governance/findings/governance-findings-demo-rows";
import {
  dedupeGovernanceFindingRows,
  decisionRegisterRows,
  riskRegisterRows,
  traceRowsForRun,
} from "@/components/governance/findings/governance-findings-row-mappers";

/** Maximum runs considered when register APIs return no rows (fallback path). */
export const GOVERNANCE_FINDINGS_FALLBACK_MAX_RUNS = 12;

/** Maximum concurrent `getRunExplanationSummary` calls per fallback batch (TB-695). */
export const GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT = 4;

export type GovernanceFindingsFetchResult = {
  readonly rows: GovernanceFindingQueueRow[];
  readonly loadFailed: boolean;
};

export async function fetchGovernanceFindingQueueRows(
  useCuratedDemoSpine: boolean,
): Promise<GovernanceFindingsFetchResult> {
  if (useCuratedDemoSpine) {
    return {
      rows: staticDemoGovernanceFindingRows(),
      loadFailed: false,
    };
  }

  try {
    const [riskRegister, decisionRegister] = await Promise.all([
      getArchitectureRiskRegister(),
      getArchitectureDecisionRegister(),
    ]);
    const registerRows = dedupeGovernanceFindingRows([
      ...riskRegisterRows(riskRegister.entries ?? []),
      ...decisionRegisterRows(decisionRegister.decisions ?? []),
    ]);

    if (registerRows.length > 0) {
      return { rows: registerRows, loadFailed: false };
    }

    const page = await listRunsByProjectPaged("default", 1, 25);
    const runItems = page.items ?? [];
    const slice = runItems.slice(0, GOVERNANCE_FINDINGS_FALLBACK_MAX_RUNS);
    const collected = await collectTraceRowsWithConcurrencyCap(slice);
    const merged = dedupeGovernanceFindingRows(collected);

    return { rows: merged, loadFailed: false };
  } catch {
    return {
      rows: useCuratedDemoSpine ? staticDemoGovernanceFindingRows() : [],
      loadFailed: true,
    };
  }
}

export async function fetchAssignedToMeFindingQueueRows(): Promise<GovernanceFindingsFetchResult> {
  try {
    const riskRegister = await getArchitectureRiskRegister({ assignedToMe: true });
    const registerRows = dedupeGovernanceFindingRows(riskRegisterRows(riskRegister.entries ?? []));

    return { rows: registerRows, loadFailed: false };
  } catch {
    return {
      rows: [],
      loadFailed: true,
    };
  }
}

export async function collectTraceRowsWithConcurrencyCap(
  runs: readonly RunSummary[],
  maxConcurrent: number = GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT,
): Promise<GovernanceFindingQueueRow[]> {
  const collected: GovernanceFindingQueueRow[] = [];

  for (let startIndex = 0; startIndex < runs.length; startIndex += maxConcurrent) {
    const batch = runs.slice(startIndex, startIndex + maxConcurrent);

    await Promise.all(
      batch.map(async (run) => {
        try {
          const summary = await getRunExplanationSummary(run.runId);
          const traces =
            summary.findingTraceConfidences ?? summary.explanation?.findingTraceConfidences ?? [];

          if (traces === null || traces.length === 0) {
            return;
          }

          collected.push(...traceRowsForRun(run, traces));
        } catch {
          /* omit runs that cannot load aggregate (permissions, draft run, etc.) */
        }
      }),
    );
  }

  return collected;
}
