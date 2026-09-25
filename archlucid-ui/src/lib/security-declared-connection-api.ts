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
    connectionId: typeof raw.connectionId === "string" ? raw.connectionId : "",
    fromCloudResourceId: typeof raw.fromCloudResourceId === "string" ? raw.fromCloudResourceId : "",
    toCloudResourceId: typeof raw.toCloudResourceId === "string" ? raw.toCloudResourceId : "",
    relationshipType: (typeof raw.relationshipType === "string" ? raw.relationshipType : "ConnectsTo") as SecurityDeclaredConnectionRelationshipType,
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
    evidenceReference: typeof raw.evidenceReference === "string" ? raw.evidenceReference : null,
    expirationUtc: typeof raw.expirationUtc === "string" ? raw.expirationUtc : "",
    status: (typeof raw.status === "string" ? raw.status : "Active") as SecurityDeclaredConnectionStatus,
    provenanceKind: typeof raw.provenanceKind === "string" ? raw.provenanceKind : "HumanAssertion",
    createdUtc: typeof raw.createdUtc === "string" ? raw.createdUtc : "",
    updatedUtc: typeof raw.updatedUtc === "string" ? raw.updatedUtc : "",
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
  return typeof raw.connectionId === "string" ? raw.connectionId : "";
}

export async function revokeSecurityDeclaredConnection(connectionId: string): Promise<void> {
  await proxyJsonPost(`${BASE_PATH}/${connectionId}/revoke`, {});
}
