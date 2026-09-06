import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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
    instanceId: String(raw.instanceId ?? ""),
    findingId: String(raw.findingId ?? ""),
    patternKey: String(raw.patternKey ?? ""),
    status: String(raw.status ?? "Classified") as RemediationInstanceSummary["status"],
    automationLevel: String(raw.automationLevel ?? ""),
    cloudResourceId: raw.cloudResourceId != null ? String(raw.cloudResourceId) : null,
    waveId: raw.waveId != null ? String(raw.waveId) : null,
    createdUtc: String(raw.createdUtc ?? ""),
    updatedUtc: String(raw.updatedUtc ?? ""),
  };
}

function mapOperationResult(raw: Record<string, unknown>): RemediationInstanceOperationResult {
  return {
    succeeded: Boolean(raw.succeeded),
    instanceId: raw.instanceId != null ? String(raw.instanceId) : null,
    status: raw.status != null ? String(raw.status) as RemediationInstanceOperationResult["status"] : null,
    blockers: Array.isArray(raw.blockers) ? raw.blockers.map((item) => String(item)) : [],
    errorMessage: raw.errorMessage != null ? String(raw.errorMessage) : null,
  };
}

export async function fetchRemediationInstances(): Promise<RemediationInstanceSummary[]> {
  const raw = await proxyJsonGet<Array<Record<string, unknown>>>(INSTANCES_PATH);

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
            findingId: String(findingRaw.findingId ?? ""),
            title: String(findingRaw.title ?? ""),
            severity: findingRaw.severity != null ? String(findingRaw.severity) : null,
            status: findingRaw.status != null ? String(findingRaw.status) : null,
            cloudResourceId: findingRaw.cloudResourceId != null ? String(findingRaw.cloudResourceId) : null,
            controlId: findingRaw.controlId != null ? String(findingRaw.controlId) : null,
          },
    activeMatch:
      matchRaw == null
        ? null
        : {
            matchResultId: String(matchRaw.matchResultId ?? ""),
            patternKey: String(matchRaw.patternKey ?? ""),
            patternVersion: String(matchRaw.patternVersion ?? ""),
            matchKind: String(matchRaw.matchKind ?? ""),
            explainText: String(matchRaw.explainText ?? ""),
          },
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            evidenceId: String(row.evidenceId ?? ""),
            phase: String(row.phase ?? ""),
            payloadJson: String(row.payloadJson ?? ""),
            createdUtc: String(row.createdUtc ?? ""),
          };
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
  if (error instanceof Error) {
    return error.message;
  }

  return toApiLoadFailure(error).message;
}
