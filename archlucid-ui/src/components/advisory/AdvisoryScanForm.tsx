"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";

import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { RunIdPicker } from "@/components/runs/RunIdPicker";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import {
  ADVISORY_SCANS_BASELINE_REVIEW_HELPER,
  ADVISORY_SCANS_BASELINE_REVIEW_LABEL,
  ADVISORY_SCANS_BASELINE_REVIEW_PLACEHOLDER,
  ADVISORY_SCANS_CANT_FIND_REVIEW_BODY,
  ADVISORY_SCANS_CANT_FIND_REVIEW_SUMMARY,
  ADVISORY_SCANS_FINALIZED_REVIEW_LABEL,
  ADVISORY_SCANS_FINALIZED_REVIEW_PLACEHOLDER,
  ADVISORY_SCANS_FORM_SECTION_TITLE,
  ADVISORY_SCANS_GENERATE_BUTTON_LABEL,
  ADVISORY_SCANS_GENERATE_BUTTON_WORKING_LABEL,
  ADVISORY_SCANS_GENERATE_OUTPUT_HINT,
  ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
  ADVISORY_SCANS_MANUAL_ID_ADMIN_SUMMARY,
  ADVISORY_SCANS_MANUAL_ID_BASELINE_PLACEHOLDER,
  ADVISORY_SCANS_MANUAL_ID_TARGET_PLACEHOLDER,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF,
  ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL,
  ADVISORY_SCANS_REFRESH_SAVED_LABEL,
} from "@/lib/advisory-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

export type AdvisoryScanFormProps = {
  readonly bootstrappedRunId: string;
  readonly urlScopedRunId?: string;
  readonly reviewSelected: boolean;
  readonly loading: boolean;
  readonly runId: string;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly compareToRunId: string;
  readonly setCompareToRunId: Dispatch<SetStateAction<string>>;
  readonly isAdminCaller: boolean;
  readonly advisoryScanChecklistSteps: readonly IntegrationConnectChecklistStep[];
  readonly advisoryScanChecklistEmphasizedStepId: string;
  readonly generateDisabledHintId: string;
  readonly generateDisabledReason: WhyDisabledCtaReason | null;
  readonly onGenerate: () => void;
  readonly onRefreshSaved: () => void;
};

export function AdvisoryScanForm(props: AdvisoryScanFormProps): React.JSX.Element {
  const {
    bootstrappedRunId,
    urlScopedRunId,
    reviewSelected,
    loading,
    runId,
    setRunId,
    compareToRunId,
    setCompareToRunId,
    isAdminCaller,
    advisoryScanChecklistSteps,
    advisoryScanChecklistEmphasizedStepId,
    generateDisabledHintId,
    generateDisabledReason,
    onGenerate,
    onRefreshSaved,
  } = props;

  const hideTargetRunPicker = (urlScopedRunId?.trim() ?? "").length > 0;

  if (!reviewSelected) {
    return <></>;
  }

  return (
    <>
      <IntegrationConnectChecklist
        title="Scan checklist"
        steps={advisoryScanChecklistSteps}
        emphasizedStepId={advisoryScanChecklistEmphasizedStepId}
        testIdPrefix="advisory-scans-scan"
      />

      <section
        className={cn(DESIGN_TOKENS.surface.card, "mb-6 mt-4 space-y-4 p-5")}
        aria-label={ADVISORY_SCANS_FORM_SECTION_TITLE}
        data-testid="advisory-scan-form"
      >
        <div className="space-y-1">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {ADVISORY_SCANS_FORM_SECTION_TITLE}
          </h3>
        </div>

        <div className="grid gap-4">
          {hideTargetRunPicker ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="advisory-scan-scoped-target">
              Finalized review:{" "}
              <span className="font-mono text-al-text-primary">{bootstrappedRunId}</span>
            </p>
          ) : (
            <RunIdPicker
              label={ADVISORY_SCANS_FINALIZED_REVIEW_LABEL}
              placeholder={ADVISORY_SCANS_FINALIZED_REVIEW_PLACEHOLDER}
              value={runId}
              onChange={setRunId}
              inputId="advisory-run-id"
              committedOnly
              preferAutoPick={false}
              useBuyerFacingRunLabels
            />
          )}

          <div className="space-y-2">
            <RunIdPicker
              label={ADVISORY_SCANS_BASELINE_REVIEW_LABEL}
              placeholder={ADVISORY_SCANS_BASELINE_REVIEW_PLACEHOLDER}
              value={compareToRunId}
              onChange={setCompareToRunId}
              inputId="advisory-compare-run-id"
              committedOnly
              preferAutoPick={false}
              useBuyerFacingRunLabels
            />
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {ADVISORY_SCANS_BASELINE_REVIEW_HELPER}
            </p>
          </div>

          <details
            className={cn(
              "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
              {ADVISORY_SCANS_CANT_FIND_REVIEW_SUMMARY}
            </summary>
            <div className="mt-3 space-y-3">
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {ADVISORY_SCANS_CANT_FIND_REVIEW_BODY}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href={ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_HREF}>{ADVISORY_SCANS_OPEN_REVIEW_PACKAGES_LABEL}</Link>
              </Button>

              {isAdminCaller ? (
                <details className="rounded border border-dashed border-neutral-300 p-3 dark:border-neutral-600">
                  <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">
                    {ADVISORY_SCANS_MANUAL_ID_ADMIN_SUMMARY}
                  </summary>
                  <div className="mt-3 grid gap-2">
                    <input
                      value={runId}
                      onChange={(event) => {
                        setRunId(event.target.value);
                      }}
                      placeholder={ADVISORY_SCANS_MANUAL_ID_TARGET_PLACEHOLDER}
                      className={cn(
                        "rounded-md border border-neutral-300 bg-white p-2 font-mono text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100",
                        OPERATOR_TYPOGRAPHY.body,
                      )}
                    />
                    <input
                      value={compareToRunId}
                      onChange={(event) => {
                        setCompareToRunId(event.target.value);
                      }}
                      placeholder={ADVISORY_SCANS_MANUAL_ID_BASELINE_PLACEHOLDER}
                      className={cn(
                        "rounded-md border border-neutral-300 bg-white p-2 font-mono text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100",
                        OPERATOR_TYPOGRAPHY.body,
                      )}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          </details>
        </div>

        <div className="space-y-2">
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="advisory-scans-inline-boundary"
          >
            {ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={reviewSelected ? "primary" : "outline"}
              onClick={onGenerate}
              disabled={loading || !reviewSelected}
              aria-describedby={generateDisabledReason === null ? undefined : generateDisabledHintId}
              data-testid="advisory-generate-scan-button"
            >
              {loading ? ADVISORY_SCANS_GENERATE_BUTTON_WORKING_LABEL : ADVISORY_SCANS_GENERATE_BUTTON_LABEL}
            </Button>

            {reviewSelected ? (
              <Button type="button" variant="outline" onClick={onRefreshSaved} disabled={loading}>
                {ADVISORY_SCANS_REFRESH_SAVED_LABEL}
              </Button>
            ) : null}

            <WhyDisabledCtaHint
              id={generateDisabledHintId}
              reason={generateDisabledReason}
              testId="advisory-generate-disabled-hint"
            />
          </div>

          {reviewSelected ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {ADVISORY_SCANS_GENERATE_OUTPUT_HINT}
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
