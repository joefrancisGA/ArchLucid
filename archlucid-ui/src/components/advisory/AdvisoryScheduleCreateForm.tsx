"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { type ReactElement } from "react";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  ADVISORY_SCANS_SCHEDULES_CREATE_WORKING,
  ADVISORY_SCANS_SCHEDULES_SAMPLE_BLOCKED,
  ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT,
} from "@/lib/advisory-copy";

import { AdvisoryScheduleCreateFormFields } from "./AdvisoryScheduleCreateFormFields";
import { AdvisoryScheduleCreatePreview } from "./AdvisoryScheduleCreatePreview";
import type { AdvisoryScheduleCreateFormProps } from "./advisory-schedule-create-form-props";
import { useAdvisoryScheduleCreateForm } from "./use-advisory-schedule-create-form";

export type { AdvisoryScheduleCreateFormProps } from "./advisory-schedule-create-form-props";

export function AdvisoryScheduleCreateForm(props: AdvisoryScheduleCreateFormProps): ReactElement {
  const viewModel = useAdvisoryScheduleCreateForm(props);
  const {
    preview,
    showFormUpcomingPreview,
    advisoryCreateSteps,
    advisoryCreateEmphasizedStepId,
    onSubmit,
    mutationDisabledHintId,
    mutationDisabledReason,
    formReady,
    canEdit,
    creating,
    createSuccess,
  } = viewModel;

  return (
    <section
      id="advisory-schedule-create-form"
      className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
      data-testid="advisory-schedule-create-form"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>New schedule</h3>

      <p
        className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="advisory-schedule-inline-scope"
      >
        <span className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_SCOPE_CURRENT}:
        </span>{" "}
        <span data-testid="advisory-schedule-project-scope-label">{props.projectLabel}</span>
      </p>

      {props.sampleModeBlocked ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="advisory-schedules-sample-blocked"
        >
          {ADVISORY_SCANS_SCHEDULES_SAMPLE_BLOCKED}{" "}
          <Link className="text-al-link underline-offset-2 hover:underline" href="/get-started">
            Start an evaluation
          </Link>
          .
        </p>
      ) : null}

      <IntegrationConnectChecklist
        title="Schedule checklist"
        steps={advisoryCreateSteps}
        emphasizedStepId={advisoryCreateEmphasizedStepId}
        testIdPrefix="advisory-schedule-create"
      />

      <form onSubmit={(event) => void onSubmit(event)} className="mt-3 grid gap-4">
        <AdvisoryScheduleCreateFormFields viewModel={viewModel} />

        {showFormUpcomingPreview ? <AdvisoryScheduleCreatePreview preview={preview} /> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={!canEdit || creating || !formReady}
            aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
            data-testid="advisory-schedule-create-submit"
          >
            {creating ? ADVISORY_SCANS_SCHEDULES_CREATE_WORKING : "Create schedule"}
          </Button>
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId={mutationDisabledHintId}
          />
          {createSuccess ? (
            <p className={cn("m-0 text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} role="status">
              Schedule created.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
