/**
 * Buyer-facing SSO activate consequence preview (TB-2241).
 * Who signs in next, what stays unchanged until activate, and what rolls back / bypass.
 */

export const SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE = "What activating SSO does" as const;

export type SsoActivateConsequencePreviewRowId =
  | "whoSignsInNext"
  | "staysUnchangedUntilActivate"
  | "rollsBackOrBypass";

export type SsoActivateConsequencePreviewRow = {
  readonly id: SsoActivateConsequencePreviewRowId;
  readonly label: string;
  readonly detail: string;
};

export type SsoActivateConsequencePreview = {
  readonly title: string;
  readonly summary: string;
  readonly rows: readonly SsoActivateConsequencePreviewRow[];
};

const ROW_IDS: readonly SsoActivateConsequencePreviewRowId[] = [
  "whoSignsInNext",
  "staysUnchangedUntilActivate",
  "rollsBackOrBypass",
] as const;

/** Stable consequence matrix for the SSO wizard activate step. */
export function buildSsoActivateConsequencePreview(): SsoActivateConsequencePreview {
  return {
    title: SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE,
    summary:
      "Activating single sign-on switches this workspace to your identity provider for sign-in. Draft wizard settings stay inactive until this step succeeds.",
    rows: [
      {
        id: "whoSignsInNext",
        label: "Who signs in next",
        detail:
          "After activation, people sign in through your organization's identity provider (OIDC or SAML). Mapped roles from the successful connection test apply to those sign-ins.",
      },
      {
        id: "staysUnchangedUntilActivate",
        label: "What stays unchanged until activate",
        detail:
          "Provider metadata, claim mapping, and credentials references stay draft until you activate. Existing users keep their current sign-in path until activation succeeds.",
      },
      {
        id: "rollsBackOrBypass",
        label: "What rolls back / bypass",
        detail:
          "If activation fails, the workspace keeps the prior sign-in path. Development bypass and local admin recovery paths remain available for break-glass access — they are not replaced by a failed activate.",
      },
    ],
  };
}

export function ssoActivateConsequencePreviewRowById(
  id: SsoActivateConsequencePreviewRowId,
): SsoActivateConsequencePreviewRow {
  const preview = buildSsoActivateConsequencePreview();
  const row = preview.rows.find((candidate) => candidate.id === id);

  if (row === undefined) {
    throw new Error(`Missing SSO activate consequence preview row: ${id}`);
  }

  return row;
}

/** Guard for tests - matrix must cover every declared row id exactly once. */
export function assertSsoActivateConsequencePreviewMatrixComplete(): void {
  const ids = buildSsoActivateConsequencePreview().rows.map((row) => row.id);

  for (const expected of ROW_IDS) {
    if (!ids.includes(expected)) {
      throw new Error(`SSO activate consequence preview matrix missing row: ${expected}`);
    }
  }

  if (ids.length !== ROW_IDS.length) {
    throw new Error("SSO activate consequence preview matrix has unexpected row count.");
  }
}
