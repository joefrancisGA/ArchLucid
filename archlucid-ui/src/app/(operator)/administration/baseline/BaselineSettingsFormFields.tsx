"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { BaselineSettingsForm } from "@/app/(operator)/administration/baseline/BaselineSettingsForm";
import type { UseBaselineSettingsResult } from "@/app/(operator)/administration/baseline/use-baseline-settings";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  BASELINE_MODELED_DEFAULTS_HELPER,
  BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER,
  BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE,
  BASELINE_SETTINGS_USED_IN_SURFACES,
} from "@/lib/baseline-settings-present";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";

export type BaselineSettingsFormFieldsProps = UseBaselineSettingsResult;

export function BaselineSettingsFormFields(props: BaselineSettingsFormFieldsProps): React.JSX.Element {
  const {
    saving,
    manualPrep,
    setManualPrep,
    people,
    setPeople,
    reviewHours,
    setReviewHours,
    reviewNote,
    setReviewNote,
    reviewValidation,
    prepValidation,
    peopleValidation,
    statusTagKind,
    baselineStatusLabel,
    roiModelLabel,
    lastUpdatedLabel,
    noteRequiresHours,
    saveBlocked,
    saveDisabledReason,
    hasSavedBaseline,
    baselineSaveSteps,
    baselineSaveEmphasizedStepId,
    noteWouldBeDroppedOnSave,
    onSave,
    onResetToLoaded,
    onUseModeledDefaults,
  } = props;

  return (
    <>
      <section
        className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="baseline-settings-summary"
      >
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Baseline summary
        </h2>
        <dl className={cn("m-0 mt-3 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Baseline status</dt>
            <dd className="m-0 mt-0.5">
              <StatusTag
                kind={statusTagKind}
                label={baselineStatusLabel}
                data-testid="baseline-settings-status-tag"
              />
            </dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>ROI model</dt>
            <dd className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {roiModelLabel}
            </dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Last updated</dt>
            <dd
              className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="baseline-settings-last-updated"
            >
              {lastUpdatedLabel}
            </dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Used in</dt>
            <dd className={cn("m-0 mt-0.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <ul className="m-0 flex flex-wrap gap-x-3 gap-y-1 p-0 list-none">
                {BASELINE_SETTINGS_USED_IN_SURFACES.map((surface) => (
                  <li key={surface.href}>
                    <Link href={surface.href} className={OPERATOR_LINK.nav}>
                      {surface.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <section
        className={cn(DESIGN_TOKENS.callout.info, "rounded-lg p-4")}
        data-testid="baseline-settings-recommended-path"
      >
        <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Recommended path
        </h2>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
          <div className="space-y-1">
            <Button
              type="button"
              variant="default"
              data-testid="baseline-open-guided-wizard"
              onClick={() => {
                window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
              }}
            >
              Open guided baseline wizard
            </Button>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Recommended if you are not sure what values to enter.
            </p>
          </div>
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              data-testid="baseline-use-conservative-defaults"
              disabled={saving || hasSavedBaseline}
              onClick={() => {
                onUseModeledDefaults();
              }}
            >
              Use modeled defaults
            </Button>
            <p
              className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="baseline-modeled-defaults-helper"
            >
              {hasSavedBaseline
                ? BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER
                : BASELINE_MODELED_DEFAULTS_HELPER}
            </p>
          </div>
        </div>
      </section>

      <IntegrationConnectChecklist
        title="Save checklist"
        steps={baselineSaveSteps}
        emphasizedStepId={baselineSaveEmphasizedStepId}
        testIdPrefix="baseline-save"
      />

      <BaselineSettingsForm
        reviewHours={reviewHours}
        setReviewHours={setReviewHours}
        reviewNote={reviewNote}
        setReviewNote={setReviewNote}
        manualPrep={manualPrep}
        setManualPrep={setManualPrep}
        people={people}
        setPeople={setPeople}
        reviewValidation={reviewValidation}
        prepValidation={prepValidation}
        peopleValidation={peopleValidation}
        noteRequiresHours={noteRequiresHours}
        saveBlocked={saveBlocked}
        saveDisabledReason={saveDisabledReason}
        noteWouldBeDroppedOnSave={noteWouldBeDroppedOnSave}
        saving={saving}
        onSave={onSave}
        onResetToLoaded={onResetToLoaded}
      />
    </>
  );
}
