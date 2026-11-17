import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type {
  SecurityDeclaredConnectionCreateRequest,
  SecurityDeclaredConnectionRelationshipType,
  SecurityDeclaredConnectionRow,
  SecurityDeclaredConnectionStatus,
} from "@/lib/security-declared-connection-types";

const BASE_PATH = "/api/proxy/v1/operational-security/declared-connections";

function parseRelationshipType(
  value: unknown,
): SecurityDeclaredConnectionRelationshipType | undefined {
  if (value === "ConnectsTo" || value === "DependsOn") {
    return value;
  }

  return undefined;
}

function parseStatus(value: unknown): SecurityDeclaredConnectionStatus | undefined {
  if (value === "Active" || value === "Expired" || value === "Revoked") {
    return value;
  }

  return undefined;
}

function mapRow(raw: Record<string, unknown>): SecurityDeclaredConnectionRow {
  const required = (value: unknown): string => typeof value === "string" ? value.trim() : "";
  const optional = (value: unknown): string | null => {
    const mapped = required(value);

    return mapped.length > 0 ? mapped : null;
  };

  return {
    connectionId: required(raw.connectionId),
    fromCloudResourceId: required(raw.fromCloudResourceId),
    toCloudResourceId: required(raw.toCloudResourceId),
    relationshipType: parseRelationshipType(raw.relationshipType),
    rationale: required(raw.rationale),
    evidenceReference: optional(raw.evidenceReference),
    expirationUtc: required(raw.expirationUtc),
    status: parseStatus(raw.status),
    provenanceKind: optional(raw.provenanceKind) ?? undefined,
    createdUtc: required(raw.createdUtc),
    updatedUtc: required(raw.updatedUtc),
  };
}

export async function listSecurityDeclaredConnections(): Promise<SecurityDeclaredConnectionRow[]> {
  const raw = await proxyJsonGet<unknown>(BASE_PATH);

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((row): row is Record<string, unknown> => row !== null && typeof row === "object" && !Array.isArray(row))
    .map((row) => mapRow(row))
    .filter((row) => row.fromCloudResourceId.length > 0 && row.toCloudResourceId.length > 0)
    .filter((row) => row.connectionId.length > 0);
}

export async function createSecurityDeclaredConnection(
  request: SecurityDeclaredConnectionCreateRequest,
): Promise<string> {
  const raw = await proxyJsonPost<Record<string, unknown>>(BASE_PATH, request);
  const connectionId = typeof raw.connectionId === "string" ? raw.connectionId.trim() : "";

  if (connectionId.length === 0) {
    throw new Error("Declared connection id was not returned.");
  }

  return connectionId;
}

export async function revokeSecurityDeclaredConnection(connectionId: string): Promise<void> {
  await proxyJsonPost(`${BASE_PATH}/${encodeURIComponent(connectionId.trim())}/revoke`, {});
}
