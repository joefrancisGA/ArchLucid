export type ApiKeyCredentialSlot = "Admin" | "ReadOnly";

export type ApiKeyAuditAction =
  | "key_created"
  | "overlap_key_issued"
  | "key_rotated"
  | "key_revoked"
  | "rotation_failed";

export type ApiKeyAuditOutcome = "success" | "failed";

export type ApiKeyAuditEvent = {
  readonly id: string;
  readonly occurredAtUtc: string;
  readonly actor: string;
  readonly action: ApiKeyAuditAction;
  readonly keyName: string;
  readonly outcome: ApiKeyAuditOutcome;
};

export type ApiKeyPendingAction =
  | { readonly kind: "rotate_admin" }
  | { readonly kind: "rotate_readonly" }
  | { readonly kind: "issue_overlap" };

export type ApiKeysSummaryMetrics = {
  readonly accessEnabled: boolean;
  readonly activeAdminKeys: number;
  readonly activeReadOnlyKeys: number;
  readonly lastRotationUtc: string | null;
  readonly lastUsedUtc: string | null;
};
