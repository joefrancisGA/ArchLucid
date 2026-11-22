import { finiteNonNegativeNumberOrDefault } from "@/lib/parse-finite-number";
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
  VerifiedRemediationAssociationIdentifier,
} from "@/lib/infra-evidence/infra-evidence-remediation-types";
import { parseRemediationInstanceStatusFilter } from "@/lib/infra-evidence/infra-evidence-remediation-types";

const INSTANCES_PATH = "/api/proxy/v1/infra-evidence/remediation-instances";
const FACTORY_SUMMARY_PATH = "/api/proxy/v1/infra-evidence/remediation-factory/summary";
const PRIORITIZATION_RANKED_PATH = "/api/proxy/v1/operational-security/remediation-prioritization/ranked";
const WAVES_PATH = "/api/proxy/v1/operational-security/remediation-waves";
const FINDING_MATCH_PATH = "/api/proxy/v1/infra-evidence/operational-findings";

/** Absent or non-numeric metrics stay null so Home can omit the number instead of showing zero. */
function finiteNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function mapTrimmedString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
}

function mapOptionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function encodeRequiredPathSegment(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return encodeURIComponent(trimmed);
}

function mapInstanceSummary(raw: Record<string, unknown>): RemediationInstanceSummary | null {
  const status = parseRemediationInstanceStatusFilter(mapTrimmedString(raw.status));

  if (status === null) {
    return null;
  }

  return {
    instanceId: mapTrimmedString(raw.instanceId),
    findingId: mapTrimmedString(raw.findingId),
    patternKey: mapTrimmedString(raw.patternKey),
    status,
    automationLevel: mapTrimmedString(raw.automationLevel),
    cloudResourceId: mapOptionalTrimmedString(raw.cloudResourceId),
    waveId: mapOptionalTrimmedString(raw.waveId),
    preflightSnapshotId: mapOptionalTrimmedString(raw.preflightSnapshotId),
    executionSnapshotId: mapOptionalTrimmedString(raw.executionSnapshotId),
    verificationSnapshotId: mapOptionalTrimmedString(raw.verificationSnapshotId),
    createdUtc: mapTrimmedString(raw.createdUtc),
    updatedUtc: mapTrimmedString(raw.updatedUtc),
  };
}

function mapVerifiedRemediationAssociation(
  raw: Record<string, unknown>,
): VerifiedRemediationAssociationIdentifier | null {
  const instanceId = typeof raw.instanceId === "string" ? raw.instanceId.trim() : "";
  const controlId = typeof raw.controlId === "string" ? raw.controlId.trim() : "";
  const verificationSnapshotId =
    typeof raw.verificationSnapshotId === "string" ? raw.verificationSnapshotId.trim() : "";

  if (instanceId.length === 0 || controlId.length === 0 || verificationSnapshotId.length === 0) {
    return null;
  }

  const assessmentIdRaw = raw.assessmentId;

  return {
    associationId: typeof raw.associationId === "string" ? raw.associationId : "",
    instanceId,
    verificationSnapshotId,
    controlId,
    assessmentId:
      typeof assessmentIdRaw === "string" && assessmentIdRaw.trim().length > 0
        ? assessmentIdRaw.trim()
        : null,
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

  return raw.flatMap((row) => {
    const mapped = mapInstanceSummary(row);

    return mapped === null ? [] : [mapped];
  });
}

export async function fetchRemediationInstanceDetail(instanceId: string): Promise<RemediationInstanceDetail> {
  const raw = await proxyJsonGet<Record<string, unknown>>(
    `${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}`,
  );
  const instanceRaw = (raw.instance as Record<string, unknown>) ?? {};
  const findingRaw = raw.finding as Record<string, unknown> | null | undefined;
  const matchRaw = raw.activeMatch as Record<string, unknown> | null | undefined;

  const instance = mapInstanceSummary(instanceRaw);

  if (instance === null) {
    throw new Error("Remediation instance status was not recognized.");
  }

  return {
    instance,
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
    verifiedRemediationAssociations: Array.isArray(raw.verifiedRemediationAssociations)
      ? raw.verifiedRemediationAssociations.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const mapped = mapVerifiedRemediationAssociation(item as Record<string, unknown>);

          return mapped == null ? [] : [mapped];
        })
      : [],
  };
}

export async function fetchRemediationFactorySummary(): Promise<RemediationFactoryWorkbenchSummary> {
  const raw = await proxyJsonGet<Record<string, unknown>>(FACTORY_SUMMARY_PATH);
  const metricsRaw = (raw.factoryMetrics as Record<string, unknown>) ?? {};
  const openInstancesByStatus = Object.fromEntries(
    Object.entries(raw.openInstancesByStatus ?? {})
      .filter(([status, count]) => status.trim().length > 0 && typeof count === "number" && Number.isFinite(count))
      .map(([status, count]) => [status.trim(), Math.max(0, count as number)]),
  );

  return {
    factoryMetrics: {
      openFindings: finiteNonNegativeNumberOrDefault(metricsRaw.openFindings, 0),
      criticalExposureCount: finiteNonNegativeNumberOrDefault(metricsRaw.criticalExposureCount, 0),
      remediatedThisWeek: finiteNonNegativeNumberOrDefault(metricsRaw.remediatedThisWeek, 0),
      verificationFailureCount: finiteNonNegativeNumberOrDefault(metricsRaw.verificationFailureCount, 0),
      businessBlockedCount: finiteNonNegativeNumberOrDefault(metricsRaw.businessBlockedCount, 0),
    },
    openInstancesByStatus,
    waves: Array.isArray(raw.waves)
      ? raw.waves.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            waveId: mapTrimmedString(row.waveId),
            name: mapTrimmedString(row.name),
            status: mapTrimmedString(row.status),
            memberCount: finiteNonNegativeNumberOrDefault(row.memberCount, 0),
            targetSize: row.targetSize == null ? null : finiteNonNegativeNumberOrDefault(row.targetSize, 0),
          };
        })
      : [],
  };
}

export async function fetchRemediationPrioritizedFindings(): Promise<RemediationPrioritizedFinding[]> {
  const raw = await proxyJsonGet<unknown>(PRIORITIZATION_RANKED_PATH);

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const row = item as Record<string, unknown>;

    return [{
      findingId: mapTrimmedString(row.findingId),
      totalScore: finiteNonNegativeNumberOrDefault(row.totalScore, 0),
      explanationSummary: mapTrimmedString(row.explanationSummary),
      cloudResourceId: mapOptionalTrimmedString(row.cloudResourceId),
      controlId: mapOptionalTrimmedString(row.controlId),
      patternKey: mapOptionalTrimmedString(row.patternKey),
    }];
  });
}

export async function fetchRemediationWaves(): Promise<Array<{ waveId: string; name: string }>> {
  const raw = await proxyJsonGet<unknown>(WAVES_PATH);

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const row = item as Record<string, unknown>;
    const waveId = mapTrimmedString(row.waveId);
    const name = mapTrimmedString(row.name);

    return waveId.length > 0 && name.length > 0 ? [{ waveId, name }] : [];
  });
}

export async function matchOperationalFinding(findingId: string): Promise<Record<string, unknown>> {
  return proxyJsonPost<Record<string, unknown>>(
    `${FINDING_MATCH_PATH}/${encodeRequiredPathSegment(findingId, "findingId")}/match`,
    {},
  );
}

export async function createRemediationInstance(findingId: string): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(INSTANCES_PATH, { findingId: findingId.trim() });

  return mapOperationResult(raw);
}

export async function runRemediationPreflight(
  instanceId: string,
  inventorySnapshotId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/preflight`, {
    inventorySnapshotId,
  });

  return mapOperationResult(raw);
}

export async function approveRemediationInstance(instanceId: string): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/approve`, {});

  return mapOperationResult(raw);
}

export async function assignRemediationWave(
  instanceId: string,
  waveId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(
    `${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/assign-wave`,
    { waveId: waveId.trim() },
  );

  return mapOperationResult(raw);
}

export async function executeRemediationInstance(
  instanceId: string,
  inventorySnapshotId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/execute`, {
    inventorySnapshotId,
  });

  return mapOperationResult(raw);
}

export async function attestChangeImplemented(
  instanceId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(
    `${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/attest-change-implemented`,
    {},
  );

  return mapOperationResult(raw);
}

export async function verifyRemediationInstance(
  instanceId: string,
  verificationSnapshotId: string,
): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/verify`, {
    verificationSnapshotId,
  });

  return mapOperationResult(raw);
}

export async function closeRemediationInstance(instanceId: string): Promise<RemediationInstanceOperationResult> {
  const raw = await proxyJsonPost<Record<string, unknown>>(`${INSTANCES_PATH}/${encodeRequiredPathSegment(instanceId, "instanceId")}/close`, {});

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
