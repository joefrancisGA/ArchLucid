export type SecurityDeclaredConnectionRelationshipType = "ConnectsTo" | "DependsOn";

export type SecurityDeclaredConnectionStatus = "Active" | "Expired" | "Revoked";

export type SecurityDeclaredConnectionRow = {
  readonly connectionId: string;
  readonly fromCloudResourceId: string;
  readonly toCloudResourceId: string;
  readonly relationshipType: SecurityDeclaredConnectionRelationshipType;
  readonly rationale: string;
  readonly evidenceReference: string | null;
  readonly expirationUtc: string;
  readonly status: SecurityDeclaredConnectionStatus;
  readonly provenanceKind: string;
  readonly createdUtc: string;
  readonly updatedUtc: string;
};

export type SecurityDeclaredConnectionCreateRequest = {
  readonly fromCloudResourceId: string;
  readonly toCloudResourceId: string;
  readonly relationshipType: SecurityDeclaredConnectionRelationshipType;
  readonly rationale: string;
  readonly evidenceReference?: string;
  readonly expirationUtc: string;
  readonly approvedByActorKey: string;
};
