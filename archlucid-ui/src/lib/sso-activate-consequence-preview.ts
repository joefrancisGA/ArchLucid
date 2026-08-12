/**
 * Buyer-facing SSO activate consequence preview (TB-2241).
 * What the save step stores, what stays in effect, and rollback / bypass.
 */

export const SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE = "What saving this configuration does" as const;

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

/** Stable consequence matrix for the SSO wizard save-configuration step. */
export function buildSsoActivateConsequencePreview(): SsoActivateConsequencePreview {
  return {
    title: SSO_ACTIVATE_CONSEQUENCE_PREVIEW_TITLE,
    summary:
      "Saving this configuration writes your verified identity provider settings and role mapping to the identity provider record for every workspace in this organization. It does not change how anyone signs in today — turning on SSO sign-in is a separate platform configuration change.",
    rows: [
      {
        id: "whoSignsInNext",
        label: "Who signs in next",
        detail:
          "Nobody's sign-in path changes as a result of this step. Everyone continues on the current sign-in path until your platform administrator completes the separate platform configuration change to turn on SSO sign-in.",
      },
      {
        id: "staysUnchangedUntilActivate",
        label: "What the record stores vs. what is in effect",
        detail:
          "This step marks the identity provider configuration record active with your issuer, claim mapping, and credentials reference. Those values are stored for the organization but are not yet used to sign anyone in until SSO sign-in is enabled at the platform level.",
      },
      {
        id: "rollsBackOrBypass",
        label: "What rolls back / bypass",
        detail:
          "Running this wizard again overwrites the stored identity provider record with new values. Break-glass local administrator recovery is unaffected either way.",
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
