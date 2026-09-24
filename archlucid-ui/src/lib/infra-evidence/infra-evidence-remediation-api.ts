import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { remediationInstanceMutationBlockedReason } from "@/lib/infra-evidence/remediation-instance-mutation-blocked-reason";
import { formatInfraEvidenceSealedManifestAwareApiError } from "@/lib/infra-evidence/infra-evidence-sealed-manifest-conflict";
import type {
  RemediationFactoryWorkbenchSummary,
  RemediationInstanceDetail,
  RemediationInstanceOperationResult,
  RemediationInstanceSummary,
  RemediationPrioritizedFinding,
} from "@/lib/infra-evidence/infra-evidence-remediation-types";

const INSTANCES_PATH = "/api/proxy/v1/infra-evidence/remediation-instances";
const FACTORY_SUMMARY_PATH = "/api/proxy/v1/infra-evidence/remediation-factory/summary";
const PRIORITIZATION_RANKED_PATH = "/api/proxy/v1/operational-security/remediation-prioritization/ranked";
const WAVES_PATH = "/api/proxy/v1/operational-security/remediation-waves";
const FINDING_MATCH_PATH = "/api/proxy/v1/infra-evidence/operational-findings";

function mapInstanceSummary(raw: Record<string, unknown>): RemediationInstanceSummary {
  return {
    instanceId: typeof raw.instanceId === "string" ? raw.instanceId : "",
    findingId: typeof raw.findingId === "string" ? raw.findingId : "",
    patternKey: typeof raw.patternKey === "string" ? raw.patternKey : "",
    status: (typeof raw.status === "string" ? raw.status : "Classified") as RemediationInstanceSummary["status"],
    automationLevel: typeof raw.automationLevel === "string" ? raw.automationLevel : "",
    cloudResourceId: typeof raw.cloudResourceId === "string" ? raw.cloudResourceId : null,
    waveId: typeof raw.waveId === "string" ? raw.waveId : null,
    preflightSnapshotId: typeof raw.preflightSnapshotId === "string" ? raw.preflightSnapshotId : null,
    executionSnapshotId: typeof raw.executionSnapshotId === "string" ? raw.executionSnapshotId : null,
    verificationSnapshotId: typeof raw.verificationSnapshotId === "string" ? raw.verificationSnapshotId : null,
    createdUtc: typeof raw.createdUtc === "string" ? raw.createdUtc : "",
    updatedUtc: typeof raw.updatedUtc === "string" ? raw.updatedUtc : "",
  };
}

function mapOperationResult(raw: Record<string, unknown>): RemediationInstanceOperationResult {
  return {
    succeeded: raw.succeeded === true,
    instanceId: typeof raw.instanceId === "string" ? raw.instanceId : null,
    status: typeof raw.status === "string" ? raw.status as RemediationInstanceOperationResult["status"] : null,
    blockers: Array.isArray(raw.blockers) ? raw.blockers.filter((item): item is string => typeof item === "string") : [],
    errorMessage: typeof raw.errorMessage === "string" ? raw.errorMessage : null,
  };
}

export async function fetchRemediationInstances(
  options: {
    readonly cloudResourceId?: string | null;
    readonly findingId?: string | null;
  } = {},
): Promise<RemediationInstanceSummary[]> {
  const params = new URLSearchParams();

  if (options.cloudResourceId != null && options.cloudResourceId.trim().length > 0) {
    params.set("cloudResourceId", options.cloudResourceId.trim());
  }

  if (options.findingId != null && options.findingId.trim().length > 0) {
    params.set("findingId", options.findingId.trim());
  }

  const query = params.toString();
  const path = query.length === 0 ? INSTANCES_PATH : `${INSTANCES_PATH}?${query}`;

  const raw = await proxyJsonGet<Array<Record<string, unknown>>>(path);

  return raw.map(mapInstanceSummary);
}

export async function fetchRemediationInstanceDetail(instanceId: string): Promise<RemediationInstanceDetail> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}`);
  const instanceRaw = (raw.instance as Record<string, unknown>) ?? {};
  const findingRaw = raw.finding as Record<string, unknown> | null | undefined;
  const matchRaw = raw.activeMatch as Record<string, unknown> | null | undefined;

  return {
    instance: mapInstanceSummary(instanceRaw),
    finding:
      findingRaw == null
        ? null
        : {
            findingId: typeof findingRaw.findingId === "string" ? findingRaw.findingId : "",
            title: typeof findingRaw.title === "string" ? findingRaw.title : "",
            severity: typeof findingRaw.severity === "string" ? findingRaw.severity : null,
            status: typeof findingRaw.status === "string" ? findingRaw.status : null,
            cloudResourceId: typeof findingRaw.cloudResourceId === "string" ? findingRaw.cloudResourceId : null,
            controlId: typeof findingRaw.controlId === "string" ? findingRaw.controlId : null,
          },
    activeMatch:
      matchRaw == null
        ? null
        : {
            matchResultId: typeof matchRaw.matchResultId === "string" ? matchRaw.matchResultId : "",
            patternKey: typeof matchRaw.patternKey === "string" ? matchRaw.patternKey : "",
            patternVersion: typeof matchRaw.patternVersion === "string" ? matchRaw.patternVersion : "",
            matchKind: typeof matchRaw.matchKind === "string" ? matchRaw.matchKind : "",
            explainText: typeof matchRaw.explainText === "string" ? matchRaw.explainText : "",
          },
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const row = item as Record<string, unknown>;

          if (
            typeof row.evidenceId !== "string"
            || typeof row.phase !== "string"
            || typeof row.payloadJson !== "string"
            || typeof row.createdUtc !== "string"
          ) {
            return [];
          }

          return [{
            evidenceId: row.evidenceId,
            phase: row.phase,
            payloadJson: row.payloadJson,
            createdUtc: row.createdUtc,
          }];
        })
      : [],
  };
}

export async function fetchRemediationFactorySummary(): Promise<RemediationFactoryWorkbenchSummary> {
  const raw = await proxyJsonGet<Record<string, unknown>>(FACTORY_SUMMARY_PATH);
  const metricsRaw = (raw.factoryMetrics as Record<string, unknown>) ?? {};

  return {
    factoryMetrics: {
      openFindings: Number(metricsRaw.openFindings ?? 0),
      remediatedThisWeek: Number(metricsRaw.remediatedThisWeek ?? 0),
      verificationFailureCount: Number(metricsRaw.verificationFailureCount ?? 0),
      businessBlockedCount: Number(metricsRaw.businessBlockedCount ?? 0),
    },
    openInstancesByStatus: (raw.openInstancesByStatus as Record<string, number>) ?? {},
    waves: Array.isArray(raw.waves)
      ? raw.waves.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            waveId: String(row.waveId ?? ""),
            name: String(row.name ?? ""),
            status: String(row.status ?? ""),
            memberCount: Number(row.memberCount ?? 0),
            targetSize: row.targetSize != null ? Number(row.targetSize) : null,
          };
        })
      : [],
  };
}

export async function fetchRemediationPrioritizedFindings(): Promise<RemediationPrioritizedFinding[]> {
  const raw = await proxyJsonGet<Array<Record<string, unknown>>>(PRIORITIZATION_RANKED_PATH);

  return raw.map((row) => ({
    findingId: String(row.findingId ?? ""),
    totalScore: Number(row.totalScore ?? 0),
    explanationSummary: String(row.explanationSummary ?? ""),
    cloudResourceId: row.cloudResourceId != null ? String(row.cloudResourceId) : null,
    controlId: row.controlId != null ? String(row.controlId) : null,
    patternKey: row.patternKey != null ? String(row.patternKey) : null,
  }));
}

export async function fetchRemediationWaves(): Promise<Array<{ waveId: string; name: string }>> {
  const raw = await proxyJsonGet<Array<Record<string, unknown>>>(WAVES_PATH);

  return raw.map((row) => ({
    waveId: String(row.waveId ?? ""),
    name: String(row.name ?? ""),
  }));
}

export async function matchOperationalFinding(findingId: string): Promise<Record<string, unknown>> {
  return proxyJsonPost<Record<string, unknown>>(`${FINDING_MATCH_PATH}/${findingId}/match`, {});
}

export async function createRemediationInstance(findingId: string): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(INSTANCES_PATH, { findingId });

  return mapOperationResult(raw);
}

export async function runRemediationPreflight(
  instanceId: string,
  inventorySnapshotId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}/preflight`, {
    inventorySnapshotId,
  });

  return mapOperationResult(raw);
}

export async function approveRemediationInstance(instanceId: string): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}/approve`, {});

  return mapOperationResult(raw);
}

export async function assignRemediationWave(
  instanceId: string,
  waveId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}/assign-wave`, { waveId });

  return mapOperationResult(raw);
}

export async function executeRemediationInstance(
  instanceId: string,
  inventorySnapshotId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}/execute`, {
    inventorySnapshotId,
  });

  return mapOperationResult(raw);
}

export async function verifyRemediationInstance(
  instanceId: string,
  verificationSnapshotId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}/verify`, {
    verificationSnapshotId,
  });

  return mapOperationResult(raw);
}

export async function closeRemediationInstance(instanceId: string): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${instanceId}/close`, {});

  return mapOperationResult(raw);
}

export function formatInfraEvidenceRemediationApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blockedReason = remediationInstanceMutationBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
