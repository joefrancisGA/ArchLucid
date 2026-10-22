/**
 * Success feedback convention for operator mutations (TB-2376).
 *
 * Two success affordances exist and were being chosen ad hoc, so the same class of action —
 * "save these settings" — announced itself as a transient toast on one screen and a durable
 * in-page callout on the next. The deciding question is where the user's attention is when the
 * mutation resolves, not how important the mutation felt to the author.
 *
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */

/** Where a completed mutation should announce itself. */
export type OperatorSuccessFeedbackChannel =
  /** User stays on the mutated surface and must be able to re-read the confirmation. */
  | "inline-callout"
  /** User is navigated away, or the work continues in the background after the call resolves. */
  | "toast";

export type OperatorSuccessFeedbackRule = {
  readonly channel: OperatorSuccessFeedbackChannel;
  readonly when: string;
  readonly primitive: string;
};

export const OPERATOR_SUCCESS_FEEDBACK_RULES: readonly OperatorSuccessFeedbackRule[] = [
  {
    channel: "inline-callout",
    when: "The mutation changes state on the surface the user is still looking at (settings save, role grant, connection edit, disposition change).",
    primitive: "OperatorSuccessCallout",
  },
  {
    channel: "toast",
    when: "The surface unmounts on success (wizard completion that routes away) or the outcome lands somewhere the user is not currently watching (queued export, background retry).",
    primitive: "showSuccess",
  },
];

/**
 * Surfaces that keep the user in place after a mutation and therefore must not use `showSuccess`.
 *
 * Paths are relative to `archlucid-ui/src`. This registry only grows: adding a screen here and
 * migrating it is how the convention spreads. `operator-success-feedback-contract.test.ts`
 * enforces that none of these import the toast success helper.
 */
export const INLINE_SUCCESS_CALLOUT_SURFACES: readonly string[] = [
  "app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.tsx",
  "app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.tsx",
  "app/(operator)/administration/workspace-settings/_sections/TenantCostSettingsCard.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/AwsConnectionDisconnectDialog.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/GcpConnectionDisconnectDialog.tsx",
];

/**
 * Surfaces that legitimately toast because the user leaves them on success. Listed so the
 * distinction is reviewable rather than implicit in whichever import a file happens to carry.
 */
export const TOAST_ON_SUCCESS_SURFACES: readonly string[] = [
  "app/(operator)/architecture/reviews/new/NewRunWizardClient.tsx",
  "app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx",
];
