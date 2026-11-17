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
    status: raw.status === "Proposed" || raw.status === "Confirmed" || raw.status === "Dismissed"
      ? raw.status
      : typeof raw.status === "string" && raw.status.trim().length > 0
        ? ""
        : null,
    source: raw.source === "upload" || raw.source === "questionnaire"
      ? raw.source
      : typeof raw.source === "string" && raw.source.trim().length > 0
        ? ""
        : null,
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
    provenanceKind: mapRequired(raw.provenanceKind),
    createdUtc: mapRequired(raw.createdUtc),
    updatedUtc: mapRequired(raw.updatedUtc),
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
  await proxyJsonPost(`${snapshotBasePath(snapshotId)}/confirm`, {
    ...request,
    connectionId: request.connectionId.trim(),
  });
}

export async function dismissOperatorInferredConnection(
  snapshotId: string,
  request: OperatorInferredConnectionDismissRequest,
): Promise<void> {
  await proxyJsonPost(`${snapshotBasePath(snapshotId)}/dismiss`, {
    connectionId: request.connectionId.trim(),
  });
}
