import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type {
  InferenceQuestionnaireListResponse,
  OperatorInferredConnectionConfirmRequest,
  OperatorInferredConnectionDismissRequest,
  OperatorInferredConnectionRow,
} from "@/lib/infra-evidence/operator-inferred-connection-types";

function mapRow(raw: Record<string, unknown>): OperatorInferredConnectionRow {
  return {
    connectionId: typeof raw.connectionId === "string" ? raw.connectionId : "",
    snapshotId: typeof raw.snapshotId === "string" ? raw.snapshotId : "",
    status: (typeof raw.status === "string" ? raw.status : "Proposed") as OperatorInferredConnectionRow["status"],
    source: (typeof raw.source === "string" ? raw.source : "upload") as OperatorInferredConnectionRow["source"],
    ruleName: typeof raw.ruleName === "string" ? raw.ruleName : null,
    questionText: typeof raw.questionText === "string" ? raw.questionText : null,
    fromArmId: typeof raw.fromArmId === "string" ? raw.fromArmId : null,
    fromLabel: typeof raw.fromLabel === "string" ? raw.fromLabel : null,
    fromCloudResourceId: typeof raw.fromCloudResourceId === "string" ? raw.fromCloudResourceId : null,
    toHost: typeof raw.toHost === "string" ? raw.toHost : null,
    toCatalog: typeof raw.toCatalog === "string" ? raw.toCatalog : null,
    toArmId: typeof raw.toArmId === "string" ? raw.toArmId : null,
    toCloudResourceId: typeof raw.toCloudResourceId === "string" ? raw.toCloudResourceId : null,
    settingName: typeof raw.settingName === "string" ? raw.settingName : null,
    sourceFileFormat: typeof raw.sourceFileFormat === "string" ? raw.sourceFileFormat : null,
    provenanceKind: typeof raw.provenanceKind === "string" ? raw.provenanceKind : "DeterministicInference",
    createdUtc: typeof raw.createdUtc === "string" ? raw.createdUtc : "",
    updatedUtc: typeof raw.updatedUtc === "string" ? raw.updatedUtc : "",
  };
}

function finiteNumberOrDefault(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    totalCount: finiteNumberOrDefault(raw.totalCount, items.length),
    cap: finiteNumberOrDefault(raw.cap, 50),
    capReached: raw.capReached === true,
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
