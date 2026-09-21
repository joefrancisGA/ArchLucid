import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type {
  InferenceQuestionnaireListResponse,
  OperatorInferredConnectionConfirmRequest,
  OperatorInferredConnectionDismissRequest,
  OperatorInferredConnectionRow,
} from "@/lib/infra-evidence/operator-inferred-connection-types";

function mapRow(raw: Record<string, unknown>): OperatorInferredConnectionRow {
  return {
    connectionId: String(raw.connectionId ?? ""),
    snapshotId: String(raw.snapshotId ?? ""),
    status: String(raw.status ?? "Proposed") as OperatorInferredConnectionRow["status"],
    source: String(raw.source ?? "upload") as OperatorInferredConnectionRow["source"],
    ruleName: raw.ruleName != null ? String(raw.ruleName) : null,
    questionText: raw.questionText != null ? String(raw.questionText) : null,
    fromArmId: raw.fromArmId != null ? String(raw.fromArmId) : null,
    fromLabel: raw.fromLabel != null ? String(raw.fromLabel) : null,
    fromCloudResourceId: raw.fromCloudResourceId != null ? String(raw.fromCloudResourceId) : null,
    toHost: raw.toHost != null ? String(raw.toHost) : null,
    toCatalog: raw.toCatalog != null ? String(raw.toCatalog) : null,
    toArmId: raw.toArmId != null ? String(raw.toArmId) : null,
    toCloudResourceId: raw.toCloudResourceId != null ? String(raw.toCloudResourceId) : null,
    settingName: raw.settingName != null ? String(raw.settingName) : null,
    sourceFileFormat: raw.sourceFileFormat != null ? String(raw.sourceFileFormat) : null,
    provenanceKind: String(raw.provenanceKind ?? "DeterministicInference"),
    createdUtc: String(raw.createdUtc ?? ""),
    updatedUtc: String(raw.updatedUtc ?? ""),
  };
}

function snapshotBasePath(snapshotId: string): string {
  return `/api/proxy/v1/infra-evidence/snapshots/${snapshotId}/operator-inferred-connections`;
}

export async function listOperatorInferredConnections(
  snapshotId: string,
): Promise<OperatorInferredConnectionRow[]> {
  const raw = await proxyJsonGet<Record<string, unknown>[]>(snapshotBasePath(snapshotId));
  return raw.map((row) => mapRow(row));
}

export async function listInferenceQuestionnaireItems(
  snapshotId: string,
): Promise<InferenceQuestionnaireListResponse> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${snapshotBasePath(snapshotId)}/questionnaire`);
  const items = Array.isArray(raw.items)
    ? raw.items.map((row) => mapRow(row as Record<string, unknown>))
    : [];

  return {
    items,
    totalCount: Number(raw.totalCount ?? items.length),
    cap: Number(raw.cap ?? 50),
    capReached: Boolean(raw.capReached),
  };
}

export async function confirmOperatorInferredConnection(
  snapshotId: string,
  request: OperatorInferredConnectionConfirmRequest,
): Promise<void> {
  await proxyJsonPost(`${snapshotBasePath(snapshotId)}/confirm`, request);
}

export async function dismissOperatorInferredConnection(
  snapshotId: string,
  request: OperatorInferredConnectionDismissRequest,
): Promise<void> {
  await proxyJsonPost(`${snapshotBasePath(snapshotId)}/dismiss`, request);
}
