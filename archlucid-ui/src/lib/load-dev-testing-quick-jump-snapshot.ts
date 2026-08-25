import { getRunDetail, listArtifacts } from "@/lib/api/architecture-runs";
import { fetchLearningPlans } from "@/lib/api/learning-evolution-api";
import { listApprovalRequests } from "@/lib/api/policy-governance-api";
import type { ApiGetOptions } from "@/lib/api/http";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";

export const DEV_TESTING_QUICK_JUMP_MAX_ITEMS = 8;

export const DEV_TESTING_QUICK_JUMP_MANIFEST_PROBE_RUNS = 4;

export const DEV_TESTING_QUICK_JUMP_ARTIFACT_PROBE_MANIFESTS = 2;

const QUIET_PROBE_GET_OPTIONS: ApiGetOptions = {
  suppressErrorToast: true,
};

export type DevTestingQuickJumpPlanLink = {
  readonly planId: string;
};

export type DevTestingQuickJumpRunLink = {
  readonly runId: string;
};

export type DevTestingQuickJumpApprovalLink = {
  readonly approvalRequestId: string;
};

export type DevTestingQuickJumpManifestLink = {
  readonly manifestId: string;
};

export type DevTestingQuickJumpArtifactLink = {
  readonly manifestId: string;
  readonly artifactId: string;
};

export type DevTestingQuickJumpSnapshot = {
  readonly plans: readonly DevTestingQuickJumpPlanLink[];
  readonly runs: readonly DevTestingQuickJumpRunLink[];
  readonly approvalRequests: readonly DevTestingQuickJumpApprovalLink[];
  readonly manifests: readonly DevTestingQuickJumpManifestLink[];
  readonly artifacts: readonly DevTestingQuickJumpArtifactLink[];
};

function uniqueNonEmptyIds(ids: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of ids) {
    const trimmed = raw?.trim() ?? "";

    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function buildRunLinks(runIds: readonly string[]): DevTestingQuickJumpRunLink[] {
  return runIds.slice(0, DEV_TESTING_QUICK_JUMP_MAX_ITEMS).map((runId) => ({ runId }));
}

function buildPlanLinks(planIds: readonly string[]): DevTestingQuickJumpPlanLink[] {
  return planIds.slice(0, DEV_TESTING_QUICK_JUMP_MAX_ITEMS).map((planId) => ({ planId }));
}

function buildApprovalLinks(approvalRequestIds: readonly string[]): DevTestingQuickJumpApprovalLink[] {
  return approvalRequestIds
    .slice(0, DEV_TESTING_QUICK_JUMP_MAX_ITEMS)
    .map((approvalRequestId) => ({ approvalRequestId }));
}

function buildManifestLinks(manifestIds: readonly string[]): DevTestingQuickJumpManifestLink[] {
  return manifestIds.slice(0, DEV_TESTING_QUICK_JUMP_MAX_ITEMS).map((manifestId) => ({ manifestId }));
}

async function loadPlanIds(signal?: AbortSignal): Promise<string[]> {
  try {
<<<<<<< HEAD
    const response = await fetchLearningPlans(DEV_TESTING_QUICK_JUMP_MAX_ITEMS, { signal });
=======
    const response = await fetchLearningPlans(DEV_TESTING_QUICK_JUMP_MAX_ITEMS, QUIET_PROBE_GET_OPTIONS);
>>>>>>> cursor/quiet-quick-jump-and-api-warmup-9725

    return uniqueNonEmptyIds(response.plans.map((plan) => plan.planId));
  } catch {
    return [];
  }
}

async function loadApprovalRequestIds(runIds: readonly string[]): Promise<string[]> {
  const probeRunIds = runIds.slice(0, DEV_TESTING_QUICK_JUMP_MANIFEST_PROBE_RUNS);
  const nested = await Promise.all(
    probeRunIds.map(async (runId) => {
      try {
        return await listApprovalRequests(runId, QUIET_PROBE_GET_OPTIONS);
      } catch {
        return [] as GovernanceApprovalRequest[];
      }
    }),
  );

  return uniqueNonEmptyIds(
    nested.flatMap((requests) => requests.map((request) => request.approvalRequestId)),
  );
}

async function resolveManifestIdsFromRuns(runIds: readonly string[]): Promise<string[]> {
  const probeRunIds = runIds.slice(0, DEV_TESTING_QUICK_JUMP_MANIFEST_PROBE_RUNS);
  const manifestIds = await Promise.all(
    probeRunIds.map(async (runId) => {
      try {
        const detailEnvelope = await getRunDetail(runId, QUIET_PROBE_GET_OPTIONS);
        const coercedDetail = coerceRunDetail(detailEnvelope.data);

        if (!coercedDetail.ok) {
          return null;
        }

        return coercedDetail.value.run.goldenManifestId?.trim() ?? null;
      } catch {
        return null;
      }
    }),
  );

  return uniqueNonEmptyIds(manifestIds);
}

async function loadArtifactLinks(manifestIds: readonly string[]): Promise<DevTestingQuickJumpArtifactLink[]> {
  const probeManifestIds = manifestIds.slice(0, DEV_TESTING_QUICK_JUMP_ARTIFACT_PROBE_MANIFESTS);
  const nested = await Promise.all(
    probeManifestIds.map(async (manifestId) => {
      try {
        const artifacts = await listArtifacts(manifestId, QUIET_PROBE_GET_OPTIONS);

        return artifacts.map((artifact) => ({
          manifestId,
          artifactId: artifact.artifactId,
        }));
      } catch {
        return [] as DevTestingQuickJumpArtifactLink[];
      }
    }),
  );

  const deduped: DevTestingQuickJumpArtifactLink[] = [];
  const seen = new Set<string>();

  for (const link of nested.flat()) {
    const artifactId = link.artifactId.trim();
    const key = `${link.manifestId.trim()}::${artifactId}`;

    if (artifactId.length === 0 || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push({ manifestId: link.manifestId.trim(), artifactId });

    if (deduped.length >= DEV_TESTING_QUICK_JUMP_MAX_ITEMS) {
      break;
    }
  }

  return deduped;
}

export function buildEmptyDevTestingQuickJumpSnapshot(runIds: readonly string[]): DevTestingQuickJumpSnapshot {
  return {
    plans: [],
    runs: buildRunLinks(runIds),
    approvalRequests: [],
    manifests: [],
    artifacts: [],
  };
}

/** Loads a capped snapshot of workspace entity ids for the dev quick-jump panel. */
export async function loadDevTestingQuickJumpSnapshot(runIds: readonly string[]): Promise<DevTestingQuickJumpSnapshot> {
  const normalizedRunIds = uniqueNonEmptyIds(runIds);
  const quickJumpSignal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(5_000)
      : undefined;
  const [planIds, approvalRequestIds, manifestIds] = await Promise.all([
    loadPlanIds(quickJumpSignal),
    loadApprovalRequestIds(normalizedRunIds),
    resolveManifestIdsFromRuns(normalizedRunIds),
  ]);
  const artifacts = await loadArtifactLinks(manifestIds);

  return {
    plans: buildPlanLinks(planIds),
    runs: buildRunLinks(normalizedRunIds),
    approvalRequests: buildApprovalLinks(approvalRequestIds),
    manifests: buildManifestLinks(manifestIds),
    artifacts,
  };
}
