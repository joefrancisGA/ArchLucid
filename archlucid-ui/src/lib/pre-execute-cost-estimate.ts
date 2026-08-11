/**
 * Pre-execute "What will this cost?" plain English (TB-2233).
 * Speaks range or remaining allotment only — never invents USD when preview is inactive.
 */

export type PreExecuteCostEstimateInput = {
  /**
   * True only when a Real-mode cost preview payload is present and usable.
   * When false/null/undefined, dollar amounts from estimate fields are ignored.
   */
  readonly previewActive?: boolean | null;
  readonly estimatedCostUsdLow?: number | null;
  readonly estimatedCostUsdHigh?: number | null;
  readonly estimatedCostUsd?: number | null;
  readonly pricingUsesIllustrativeUsdRates?: boolean | null;
  readonly remainingBudgetUsd?: number | null;
  readonly monthlyBudgetMonitoringActive?: boolean | null;
};

/** Compatible with {@link AgentExecutionCostPreviewPayload} from RunWizardCostPreviewCard. */
export type PreExecuteCostPreviewPayloadLike = {
  readonly mode: string;
  readonly estimatedCostUsd: number | null;
  readonly estimatedCostUsdLow: number | null;
  readonly estimatedCostUsdHigh: number | null;
  readonly pricingUsesIllustrativeUsdRates: boolean;
};

export type PreExecuteCostEstimateKind = "range" | "point" | "allotment" | "unknown";

export type PreExecuteCostEstimateTeaching = {
  readonly title: typeof PRE_EXECUTE_COST_ESTIMATE_TITLE;
  readonly message: string;
  readonly honestyNote: string | null;
  readonly kind: PreExecuteCostEstimateKind;
};

export const PRE_EXECUTE_COST_ESTIMATE_TITLE = "What will this cost?" as const;

const UNKNOWN_HONESTY =
  "No estimated range or remaining allotment is available on this page yet — ArchLucid will not invent dollars.";

const PREVIEW_INACTIVE_HONESTY =
  "Exact dollar cost for this review is not available yet — ArchLucid will not invent a price when the cost preview is inactive.";

const RANGE_UNAVAILABLE_HONESTY =
  "A dollar range for this review is not available yet — ArchLucid will not invent one.";

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatUsdTwoDecimals(value: number): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function remainingAllotmentClause(remainingUsd: number): string {
  return ` About ${formatUsdTwoDecimals(remainingUsd)} remains in this workspace's AI allotment this month.`;
}

/**
 * Builds pre-execute cost teaching from optional estimate + allotment fields.
 * Ignores estimate USD unless {@link PreExecuteCostEstimateInput.previewActive} is true.
 */
export function buildPreExecuteCostEstimateTeaching(
  input: PreExecuteCostEstimateInput,
): PreExecuteCostEstimateTeaching {
  const previewActive = input.previewActive === true;
  const low = input.estimatedCostUsdLow;
  const high = input.estimatedCostUsdHigh ?? input.estimatedCostUsd;
  const hasLow = isFiniteNumber(low);
  const hasHigh = isFiniteNumber(high);
  const hasBand = previewActive && hasLow && hasHigh;
  const hasPoint = previewActive && !hasBand && hasHigh;
  const illustrative = input.pricingUsesIllustrativeUsdRates === true;

  const budgetActive = input.monthlyBudgetMonitoringActive === true;
  const remaining = input.remainingBudgetUsd;
  const hasRemaining = budgetActive && isFiniteNumber(remaining);
  const remainingClause = hasRemaining ? remainingAllotmentClause(remaining) : "";

  if (hasBand) {
    const lowVal = low;
    const highVal = high;
    const orderedLow = Math.min(lowVal, highVal);
    const orderedHigh = Math.max(lowVal, highVal);
    const same = orderedLow === orderedHigh;
    const rangeLabel = same
      ? formatUsdTwoDecimals(orderedLow)
      : `${formatUsdTwoDecimals(orderedLow)}–${formatUsdTwoDecimals(orderedHigh)}`;

    return {
      title: PRE_EXECUTE_COST_ESTIMATE_TITLE,
      message: `Starting this architecture package typically draws about ${rangeLabel} of AI usage (low-to-high estimate).${remainingClause}`,
      honestyNote: illustrative
        ? "These amounts use illustrative list rates until your host overrides them to match your deployment pricing. They are planning guidance, not an invoice."
        : "This range is a planning estimate from the cost preview — not a billed invoice line.",
      kind: same ? "point" : "range",
    };
  }

  if (hasPoint) {
    return {
      title: PRE_EXECUTE_COST_ESTIMATE_TITLE,
      message: `Starting this architecture package typically draws about ${formatUsdTwoDecimals(high)} of AI usage.${remainingClause}`,
      honestyNote: illustrative
        ? "This amount uses illustrative list rates until your host overrides them to match your deployment pricing. It is planning guidance, not an invoice."
        : "This figure is a planning estimate from the cost preview — not a billed invoice line.",
      kind: "point",
    };
  }

  if (hasRemaining) {
    return {
      title: PRE_EXECUTE_COST_ESTIMATE_TITLE,
      message: `Starting this architecture package uses your workspace AI allotment. About ${formatUsdTwoDecimals(remaining)} remains this month.`,
      honestyNote: previewActive ? RANGE_UNAVAILABLE_HONESTY : PREVIEW_INACTIVE_HONESTY,
      kind: "allotment",
    };
  }

  return {
    title: PRE_EXECUTE_COST_ESTIMATE_TITLE,
    message:
      "Starting this architecture package may use AI allotment. ArchLucid does not show an exact dollar amount until a Real-mode cost preview is available.",
    honestyNote: UNKNOWN_HONESTY,
    kind: "unknown",
  };
}

/**
 * Maps RunWizardCostPreviewCard / agent-execution cost-preview payload into SoT input.
 * Simulator or missing payload → previewActive false (no invented USD).
 */
export function preExecuteCostEstimateInputFromPreviewPayload(
  payload: PreExecuteCostPreviewPayloadLike | null | undefined,
  budget?: {
    readonly remainingBudgetUsd?: number | null;
    readonly monthlyBudgetMonitoringActive?: boolean | null;
  },
): PreExecuteCostEstimateInput {
  const remainingBudgetUsd = budget?.remainingBudgetUsd ?? null;
  const monthlyBudgetMonitoringActive = budget?.monthlyBudgetMonitoringActive ?? null;

  if (payload == null) {
    return {
      previewActive: false,
      remainingBudgetUsd,
      monthlyBudgetMonitoringActive,
    };
  }

  const real = payload.mode === "Real";

  return {
    previewActive: real,
    estimatedCostUsd: real ? payload.estimatedCostUsd : null,
    estimatedCostUsdLow: real ? payload.estimatedCostUsdLow : null,
    estimatedCostUsdHigh: real ? payload.estimatedCostUsdHigh : null,
    pricingUsesIllustrativeUsdRates: real ? payload.pricingUsesIllustrativeUsdRates : false,
    remainingBudgetUsd,
    monthlyBudgetMonitoringActive,
  };
}
