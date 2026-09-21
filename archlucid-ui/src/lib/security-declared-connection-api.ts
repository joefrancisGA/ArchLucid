import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";
import type {
  SecurityDeclaredConnectionCreateRequest,
  SecurityDeclaredConnectionRelationshipType,
  SecurityDeclaredConnectionRow,
  SecurityDeclaredConnectionStatus,
} from "@/lib/security-declared-connection-types";

const BASE_PATH = "/api/proxy/v1/operational-security/declared-connections";

function mapRow(raw: Record<string, unknown>): SecurityDeclaredConnectionRow {
  return {
    connectionId: String(raw.connectionId ?? ""),
    fromCloudResourceId: String(raw.fromCloudResourceId ?? ""),
    toCloudResourceId: String(raw.toCloudResourceId ?? ""),
    relationshipType: String(raw.relationshipType ?? "ConnectsTo") as SecurityDeclaredConnectionRelationshipType,
    rationale: String(raw.rationale ?? ""),
    evidenceReference: raw.evidenceReference != null ? String(raw.evidenceReference) : null,
    expirationUtc: String(raw.expirationUtc ?? ""),
    status: String(raw.status ?? "Active") as SecurityDeclaredConnectionStatus,
    provenanceKind: String(raw.provenanceKind ?? "HumanAssertion"),
    createdUtc: String(raw.createdUtc ?? ""),
    updatedUtc: String(raw.updatedUtc ?? ""),
  };
}

export async function listSecurityDeclaredConnections(): Promise<SecurityDeclaredConnectionRow[]> {
  const raw = await proxyJsonGet<Record<string, unknown>[]>(BASE_PATH);
  return raw.map((row) => mapRow(row));
}

export async function createSecurityDeclaredConnection(
  request: SecurityDeclaredConnectionCreateRequest,
): Promise<string> {
  const raw = await proxyJsonPost<Record<string, unknown>>(BASE_PATH, request);
  return String(raw.connectionId ?? "");
}

export async function revokeSecurityDeclaredConnection(connectionId: string): Promise<void> {
  await proxyJsonPost(`${BASE_PATH}/${connectionId}/revoke`, {});
}
