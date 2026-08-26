"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER } from "@/lib/architecture/architecture-scorecard-page-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PilotScorecardRoiFieldErrors = {
  readonly hours: string | null;
  readonly reviews: string | null;
  readonly rate: string | null;
};

export type PilotScorecardRoiPanelProps = {
  readonly showRoiEstimatePanel: boolean;
  readonly sampleMode: boolean;
  readonly displayHours: string;
  readonly displayReviews: string;
  readonly displayRate: string;
  readonly fieldErrors: PilotScorecardRoiFieldErrors;
  readonly assumptionsReadOnly: boolean;
  readonly saveReadinessMessage: string | null;
  readonly saveReadinessId: string;
  readonly onSaveBaselines: () => void | Promise<void>;
  readonly canSaveAssumptions: boolean;
  readonly saving: boolean;
  readonly setHours: (value: string) => void;
  readonly setReviews: (value: string) => void;
  readonly setRate: (value: string) => void;
  readonly showPreviewBadge: boolean;
  readonly annualSavingsLabel: string | null;
  readonly quarterlySavingsLabel: string | null;
  readonly statusQuoCostLabel: string | null;
};

export function PilotScorecardRoiPanel({
  showRoiEstimatePanel,
  sampleMode,
  displayHours,
  displayReviews,
  displayRate,
  fieldErrors,
  assumptionsReadOnly,
  saveReadinessMessage,
  saveReadinessId,
  onSaveBaselines,
  canSaveAssumptions,
  saving,
  setHours,
  setReviews,
  setRate,
  showPreviewBadge,
  annualSavingsLabel,
  quarterlySavingsLabel,
  statusQuoCostLabel,
}: PilotScorecardRoiPanelProps) {
  return (
    <section
      aria-labelledby="roi-assumptions-heading"
      className={cn("grid gap-4 lg:items-start", showRoiEstimatePanel ? "lg:grid-cols-2" : "")}
      id="roi-assumptions"
      data-testid="review-scorecard-roi-assumptions"
    >
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 id="roi-assumptions-heading" className={OPERATOR_NAV_GROUP_LABEL}>
          ROI assumptions
        </h2>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          {sampleMode
            ? "Illustrative assumptions shown for evaluation — edit your workspace data to model real savings."
            : "Enter baseline assumptions to preview review-time savings, then save for the workspace."}{" "}
          {ARCHITECTURE_SCORECARD_DIRECTIONAL_ROI_HELPER}
        </p>
        <div className="mt-4 grid gap-3">
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className="text-al-text-primary">Hours saved per review</span>
            <input
              className={cn(
                "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={displayHours}
              onChange={(e) => setHours(e.target.value)}
              inputMode="decimal"
              disabled={assumptionsReadOnly}
              aria-invalid={fieldErrors.hours !== null}
              aria-describedby={fieldErrors.hours !== null ? "scorecard-hours-error" : undefined}
            />
            {fieldErrors.hours !== null ? (
              <p id="scorecard-hours-error" className={cn("mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.hours}
              </p>
            ) : null}
          </label>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className="text-al-text-primary">Reviews per quarter</span>
            <input
              className={cn(
                "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={displayReviews}
              onChange={(e) => setReviews(e.target.value)}
              inputMode="numeric"
              disabled={assumptionsReadOnly}
              aria-invalid={fieldErrors.reviews !== null}
              aria-describedby={fieldErrors.reviews !== null ? "scorecard-reviews-error" : undefined}
            />
            {fieldErrors.reviews !== null ? (
              <p id="scorecard-reviews-error" className={cn("mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.reviews}
              </p>
            ) : null}
          </label>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className="text-al-text-primary">Architect hourly cost ($/hour)</span>
            <input
              className={cn(
                "mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={displayRate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="decimal"
              disabled={assumptionsReadOnly}
              aria-invalid={fieldErrors.rate !== null}
              aria-describedby={fieldErrors.rate !== null ? "scorecard-rate-error" : undefined}
            />
            {fieldErrors.rate !== null ? (
              <p id="scorecard-rate-error" className={cn("mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
                {fieldErrors.rate}
              </p>
            ) : null}
          </label>
          {saveReadinessMessage !== null ? (
            <p
              id={saveReadinessId}
              className={OPERATOR_TYPOGRAPHY.helper}
              data-testid="review-scorecard-assumptions-incomplete"
            >
              {saveReadinessMessage}
            </p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            onClick={() => void onSaveBaselines()}
            disabled={sampleMode || !canSaveAssumptions}
            aria-describedby={saveReadinessMessage !== null ? saveReadinessId : undefined}
            className="disabled:bg-neutral-200 disabled:text-neutral-700 disabled:opacity-100 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-200"
            data-testid="review-scorecard-save-assumptions"
          >
            {saving ? "Saving…" : "Save ROI assumptions"}
          </Button>
        </div>
      </div>

      {showRoiEstimatePanel ? (
        <div
          className="rounded-lg border border-neutral-200 border-l-4 border-l-[var(--al-accent-interactive)] bg-al-surface-raised p-4 dark:border-neutral-800"
          data-testid="review-scorecard-roi-estimate"
          aria-labelledby="roi-estimate"
        >
          <h2 id="roi-estimate" className={OPERATOR_NAV_GROUP_LABEL}>
            Estimated savings
          </h2>
          {showPreviewBadge ? (
            <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-scorecard-roi-preview-badge">
              Live preview — save to persist for sponsor exports.
            </p>
          ) : null}
          {annualSavingsLabel !== null ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Annual estimated savings
                </p>
                <p className={cn("m-0 mt-1 font-mono text-4xl font-semibold tabular-nums text-al-text-primary")}>
                  {annualSavingsLabel}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Quarterly estimate
                  </p>
                  <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {quarterlySavingsLabel ?? " — "}
                  </p>
                </div>
                <div>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Status quo annual labor
                  </p>
                  <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {statusQuoCostLabel ?? " — "}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
