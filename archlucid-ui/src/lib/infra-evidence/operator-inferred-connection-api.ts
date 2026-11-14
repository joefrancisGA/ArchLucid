import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import { finiteNonNegativeNumberOrDefault } from "@/lib/parse-finite-number";
import type {
  InferenceQuestionnaireListResponse,
  OperatorInferredConnectionConfirmRequest,
  OperatorInferredConnectionDismissRequest,
  OperatorInferredConnectionRow,
} from "@/lib/infra-evidence/operator-inferred-connection-types";

function mapRow(raw: Record<string, unknown>): OperatorInferredConnectionRow {
  const mapRequired = (value: unknown): string => typeof value === "string" ? value.trim() : "";
  const mapOptional = (value: unknown): string | null => {
    const mapped = mapRequired(value);

    return mapped.length > 0 ? mapped : null;
  };

  return {
    connectionId: mapRequired(raw.connectionId),
    snapshotId: mapRequired(raw.snapshotId),
    status: typeof raw.status === "string" ? raw.status as OperatorInferredConnectionRow["status"] : null,
    source: typeof raw.source === "string" ? raw.source as OperatorInferredConnectionRow["source"] : null,
    ruleName: mapOptional(raw.ruleName),
    questionText: mapOptional(raw.questionText),
    fromArmId: mapOptional(raw.fromArmId),
    fromLabel: mapOptional(raw.fromLabel),
    fromCloudResourceId: mapOptional(raw.fromCloudResourceId),
    toHost: mapOptional(raw.toHost),
    toCatalog: mapOptional(raw.toCatalog),
    toArmId: mapOptional(raw.toArmId),
    toCloudResourceId: mapOptional(raw.toCloudResourceId),
    settingName: mapOptional(raw.settingName),
    sourceFileFormat: mapOptional(raw.sourceFileFormat),
    provenanceKind: typeof raw.provenanceKind === "string" ? raw.provenanceKind : "DeterministicInference",
    createdUtc: mapRequired(raw.createdUtc),
    updatedUtc: mapRequired(raw.updatedUtc),
  };
}

function finiteNumberOrDefault(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function snapshotBasePath(snapshotId: string): string {
  return `/api/proxy/v1/infra-evidence/snapshots/${encodeURIComponent(snapshotId.trim())}/operator-inferred-connections`;
}

export async function listOperatorInferredConnections(
  snapshotId: string,
): Promise<OperatorInferredConnectionRow[]> {
  const raw = await proxyJsonGet<unknown>(snapshotBasePath(snapshotId));
  if (!Array.isArray(raw)) {
    throw new Error("SecureNow inferred connections response was invalid.");
  }

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
    totalCount: finiteNonNegativeNumberOrDefault(raw.totalCount, items.length),
    cap: finiteNonNegativeNumberOrDefault(raw.cap, 50),
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
