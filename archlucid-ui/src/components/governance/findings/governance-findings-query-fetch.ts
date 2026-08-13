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
import { toApiLoadFailure } from "@/lib/api-load-failure";

/** Maximum runs considered when register APIs return no rows (fallback path). */
export const GOVERNANCE_FINDINGS_FALLBACK_MAX_RUNS = 12;

/** Maximum concurrent `getRunExplanationSummary` calls per fallback batch (TB-695). */
export const GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT = 4;

export type GovernanceFindingsFetchFailure = {
  readonly correlationId: string | null;
  readonly httpStatus: number | null;
  readonly errorCode: string | null;
  readonly attemptedAtUtc: string;
};

export type GovernanceFindingsFetchResult = {
  readonly rows: GovernanceFindingQueueRow[];
  readonly loadFailed: boolean;
  readonly failure: GovernanceFindingsFetchFailure | null;
};

function captureGovernanceFindingsFetchFailure(error: unknown, attemptedAtUtc: string): GovernanceFindingsFetchFailure {
  const apiFailure = toApiLoadFailure(error);

  return {
    correlationId: apiFailure.correlationId,
    httpStatus: apiFailure.httpStatus,
    errorCode: apiFailure.problem?.errorCode?.trim() ?? null,
    attemptedAtUtc,
  };
}

export async function fetchGovernanceFindingQueueRows(
  useCuratedDemoSpine: boolean,
): Promise<GovernanceFindingsFetchResult> {
  if (useCuratedDemoSpine) {
    return {
      rows: staticDemoGovernanceFindingRows(),
      loadFailed: false,
      failure: null,
    };
  }

  const attemptedAtUtc = new Date().toISOString();

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
      return { rows: registerRows, loadFailed: false, failure: null };
    }

    const page = await listRunsByProjectPaged("default", 1, 25);
    const runItems = page.items ?? [];
    const slice = runItems.slice(0, GOVERNANCE_FINDINGS_FALLBACK_MAX_RUNS);
    const collected = await collectTraceRowsWithConcurrencyCap(slice);
    const merged = dedupeGovernanceFindingRows(collected);

    return { rows: merged, loadFailed: false, failure: null };
  } catch (error) {
    return {
      rows: useCuratedDemoSpine ? staticDemoGovernanceFindingRows() : [],
      loadFailed: true,
      failure: captureGovernanceFindingsFetchFailure(error, attemptedAtUtc),
    };
  }
}

export async function fetchAssignedToMeFindingQueueRows(): Promise<GovernanceFindingsFetchResult> {
  const attemptedAtUtc = new Date().toISOString();

  try {
    const riskRegister = await getArchitectureRiskRegister({ assignedToMe: true });
    const registerRows = dedupeGovernanceFindingRows(riskRegisterRows(riskRegister.entries ?? []));

    return { rows: registerRows, loadFailed: false, failure: null };
  } catch (error) {
    return {
      rows: [],
      loadFailed: true,
      failure: captureGovernanceFindingsFetchFailure(error, attemptedAtUtc),
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
