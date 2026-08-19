/**
 * Versioned trial-funnel metric contract — keep UI labels, tooltips, and exports aligned with backend aggregation.
 */
export const TRIAL_FUNNEL_METRIC_CONTRACT_VERSION = "2026-07-13" as const;

export type TrialFunnelStageId =
  | "trial-started"
  | "first-review-finalized"
  | "checkout-activity"
  | "converted";

export type TrialFunnelStageDefinition = {
  readonly stageId: TrialFunnelStageId;
  readonly label: string;
  readonly definition: string;
  readonly qualifyingEvent: string;
};

export const TRIAL_FUNNEL_STAGE_DEFINITIONS: readonly TrialFunnelStageDefinition[] = [
  {
    stageId: "trial-started",
    label: "Trial started",
    definition: "A self-service trial workspace was created during the selected window.",
    qualifyingEvent: "TrialSignupAttempted audit event",
  },
  {
    stageId: "first-review-finalized",
    label: "First review finalized",
    definition:
      "The first time a trial workspace commits a signed architecture review record (first review finalized).",
    qualifyingEvent: "TrialFirstRunCompleted audit event",
  },
  {
    stageId: "checkout-activity",
    label: "Checkout activity",
    definition: "Billing checkout was initiated or completed during the selected window.",
    qualifyingEvent: "BillingCheckoutInitiated or BillingCheckoutCompleted audit events",
  },
  {
    stageId: "converted",
    label: "Converted",
    definition:
      "Trial marked converted through ArchLucid's current commercial workflow (TenantTrialConverted audit or TrialStatus = Converted).",
    qualifyingEvent: "TenantTrialConverted audit event",
  },
] as const;

export const TRIAL_FUNNEL_CONVERSION_NOTE =
  "Conversion reflects trials marked as paid or sales-qualified in ArchLucid's current commercial workflow.";

export const TRIAL_FUNNEL_PAGE_SUBTITLE =
  "Track trial activation, review completion, conversion, and estimated first-review AI cost.";

export const TRIAL_FUNNEL_PERIOD_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
] as const;

export type TrialFunnelPeriodDays = (typeof TRIAL_FUNNEL_PERIOD_OPTIONS)[number]["value"];

export function trialFunnelStageDefinition(stageId: string): TrialFunnelStageDefinition | undefined {
  return TRIAL_FUNNEL_STAGE_DEFINITIONS.find((stage) => stage.stageId === stageId);
}
