import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import { finiteNonNegativeNumberOrDefault } from "@/lib/parse-finite-number";
import type {
  InferenceQuestionnaireListResponse,
  OperatorInferredConnectionConfirmRequest,
  OperatorInferredConnectionDismissRequest,
  OperatorInferredConnectionRow,
} from "@/lib/infra-evidence/operator-inferred-connection-types";

function mapRow(raw: Record<string, unknown>): OperatorInferredConnectionRow {
  const required = (value: unknown): string => typeof value === "string" ? value.trim() : "";
  const optional = (value: unknown): string | null => {
    const mapped = required(value);

    return mapped.length > 0 ? mapped : null;
  };

  return {
    connectionId: required(raw.connectionId),
    snapshotId: required(raw.snapshotId),
    status: optional(raw.status) as OperatorInferredConnectionRow["status"],
    source: optional(raw.source) as OperatorInferredConnectionRow["source"],
    ruleName: optional(raw.ruleName),
    questionText: optional(raw.questionText),
    fromArmId: optional(raw.fromArmId),
    fromLabel: optional(raw.fromLabel),
    fromCloudResourceId: optional(raw.fromCloudResourceId),
    toHost: optional(raw.toHost),
    toCatalog: optional(raw.toCatalog),
    toArmId: optional(raw.toArmId),
    toCloudResourceId: optional(raw.toCloudResourceId),
    settingName: optional(raw.settingName),
    sourceFileFormat: optional(raw.sourceFileFormat),
    provenanceKind: optional(raw.provenanceKind) ?? "",
    createdUtc: required(raw.createdUtc),
    updatedUtc: required(raw.updatedUtc),
  };
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

  return raw
    .filter((row): row is Record<string, unknown> => row !== null && typeof row === "object")
    .map((row) => mapRow(row));
}

export async function listInferenceQuestionnaireItems(
  snapshotId: string,
): Promise<InferenceQuestionnaireListResponse> {
  const raw = await proxyJsonGet<Record<string, unknown>>(`${snapshotBasePath(snapshotId)}/questionnaire`);
  const items = Array.isArray(raw.items)
    ? raw.items
      .filter((row): row is Record<string, unknown> => row !== null && typeof row === "object")
      .map((row) => mapRow(row))
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
