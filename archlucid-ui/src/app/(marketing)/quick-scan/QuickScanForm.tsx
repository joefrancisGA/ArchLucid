"use client";

import { type ReactElement } from "react";

import {
  QUICK_SCAN_ARCHITECTURE_CONCERNS,
  QUICK_SCAN_MAX_CONCERNS,
  QUICK_SCAN_MAX_DESCRIPTION,
  QUICK_SCAN_MAX_SYSTEM_NAME,
  QUICK_SCAN_PRIMARY_ENVIRONMENTS,
  type QuickScanArchitectureConcernValue,
} from "@/lib/quick-scan/quick-scan-constants";
import type { QuickScanFieldErrors, QuickScanFormValues } from "@/lib/quick-scan/quick-scan-validation";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type QuickScanFormFieldName = "systemName" | "primaryEnvironment" | "description" | "architectureConcerns";

export type QuickScanFormProps = {
  values: QuickScanFormValues;
  fieldErrors: QuickScanFieldErrors;
  disabled?: boolean;
  onChange: (values: QuickScanFormValues) => void;
  onFieldBlur: (fieldName: QuickScanFormFieldName) => void;
};

export function QuickScanForm({
  values,
  fieldErrors,
  disabled = false,
  onChange,
  onFieldBlur,
}: QuickScanFormProps): ReactElement {
  function toggleConcern(concern: QuickScanArchitectureConcernValue) {
    const selected = values.architectureConcerns.includes(concern);

    if (selected) {
      onChange({
        ...values,
        architectureConcerns: values.architectureConcerns.filter((entry) => entry !== concern),
      });

      return;
    }

    if (values.architectureConcerns.length >= QUICK_SCAN_MAX_CONCERNS) {
      return;
    }

    onChange({
      ...values,
      architectureConcerns: [...values.architectureConcerns, concern],
    });
  }

  const concernsAtCap = values.architectureConcerns.length >= QUICK_SCAN_MAX_CONCERNS;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className={cn("block", MARKETING_TYPOGRAPHY.formLabel)} htmlFor="quick-scan-system-name">
          System name <span className="text-al-text-secondary">(required)</span>
        </label>
        <input
          id="quick-scan-system-name"
          type="text"
          value={values.systemName}
          maxLength={QUICK_SCAN_MAX_SYSTEM_NAME}
          disabled={disabled}
          aria-invalid={fieldErrors.systemName !== undefined}
          aria-describedby={fieldErrors.systemName ? "quick-scan-system-name-error" : undefined}
          onBlur={() => onFieldBlur("systemName")}
          onChange={(event) => onChange({ ...values, systemName: event.target.value })}
          autoComplete="off"
          className="w-full max-w-xl rounded-md border border-neutral-300 bg-al-surface-base p-3 text-sm text-al-text-primary shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-neutral-700"
          placeholder="Claims intake API"
        />
        {fieldErrors.systemName ? (
          <p id="quick-scan-system-name-error" className="text-sm text-rose-700 dark:text-rose-300" role="alert">
            {fieldErrors.systemName}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className={cn("block", MARKETING_TYPOGRAPHY.formLabel)} htmlFor="quick-scan-primary-environment">
          Primary environment <span className="text-al-text-secondary">(required)</span>
        </label>
        <select
          id="quick-scan-primary-environment"
          value={values.primaryEnvironment}
          disabled={disabled}
          aria-invalid={fieldErrors.primaryEnvironment !== undefined}
          aria-describedby={fieldErrors.primaryEnvironment ? "quick-scan-primary-environment-error" : undefined}
          onBlur={() => onFieldBlur("primaryEnvironment")}
          onChange={(event) =>
            onChange({
              ...values,
              primaryEnvironment: event.target.value as QuickScanFormValues["primaryEnvironment"],
              primaryEnvironmentOther: event.target.value === "Other" ? values.primaryEnvironmentOther : "",
            })
          }
          className="w-full max-w-xl rounded-md border border-neutral-300 bg-al-surface-base p-3 text-sm text-al-text-primary shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-neutral-700"
        >
          <option value="">Select an environment</option>
          {QUICK_SCAN_PRIMARY_ENVIRONMENTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors.primaryEnvironment ? (
          <p id="quick-scan-primary-environment-error" className="text-sm text-rose-700 dark:text-rose-300" role="alert">
            {fieldErrors.primaryEnvironment}
          </p>
        ) : null}
      </div>

      {values.primaryEnvironment === "Other" ? (
        <div className="space-y-2">
          <label className={cn("block", MARKETING_TYPOGRAPHY.formLabel)} htmlFor="quick-scan-environment-other">
            Other environment <span className="text-al-text-secondary">(optional)</span>
          </label>
          <input
            id="quick-scan-environment-other"
            type="text"
            value={values.primaryEnvironmentOther}
            disabled={disabled}
            onChange={(event) => onChange({ ...values, primaryEnvironmentOther: event.target.value })}
            className="w-full max-w-xl rounded-md border border-neutral-300 bg-al-surface-base p-3 text-sm text-al-text-primary shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-neutral-700"
            placeholder="Describe the hosting environment"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex max-w-xl items-center justify-between gap-3">
          <label className={cn("block", MARKETING_TYPOGRAPHY.formLabel)} htmlFor="quick-scan-description">
            Describe the system <span className="text-al-text-secondary">(required)</span>
          </label>
          <span className={MARKETING_TYPOGRAPHY.meta} aria-live="polite">
            {values.description.length}/{QUICK_SCAN_MAX_DESCRIPTION}
          </span>
        </div>
        <textarea
          id="quick-scan-description"
          value={values.description}
          maxLength={QUICK_SCAN_MAX_DESCRIPTION}
          disabled={disabled}
          rows={6}
          aria-invalid={fieldErrors.description !== undefined}
          aria-describedby={fieldErrors.description ? "quick-scan-description-error" : undefined}
          onBlur={() => onFieldBlur("description")}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
          className="w-full max-w-xl rounded-md border border-neutral-300 bg-al-surface-base p-3 text-sm text-al-text-primary shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-neutral-700"
          placeholder="Scope, components, integrations, constraints, and operational context…"
        />
        {fieldErrors.description ? (
          <p id="quick-scan-description-error" className="text-sm text-rose-700 dark:text-rose-300" role="alert">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <div className="flex max-w-xl flex-wrap items-center justify-between gap-2">
          <legend className={MARKETING_TYPOGRAPHY.formLabel}>
            Optional architecture concerns <span className="text-al-text-secondary">(up to {QUICK_SCAN_MAX_CONCERNS})</span>
          </legend>
          <span className={MARKETING_TYPOGRAPHY.meta} data-testid="quick-scan-concerns-count" aria-live="polite">
            {values.architectureConcerns.length} of {QUICK_SCAN_MAX_CONCERNS} selected
          </span>
        </div>
        <div className="flex max-w-xl flex-wrap gap-2">
          {QUICK_SCAN_ARCHITECTURE_CONCERNS.map((concern) => {
            const selected = values.architectureConcerns.includes(concern.value);

            return (
              <label
                key={concern.value}
                className={cn(
                  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  selected
                    ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                    : "border-neutral-300 text-al-text-primary dark:border-neutral-600",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected}
                  disabled={disabled || (!selected && concernsAtCap)}
                  onChange={() => toggleConcern(concern.value)}
                />
                {concern.label}
              </label>
            );
          })}
        </div>
        {concernsAtCap ? (
          <p className={MARKETING_TYPOGRAPHY.meta} data-testid="quick-scan-concerns-cap-hint">
            Maximum {QUICK_SCAN_MAX_CONCERNS} concerns — deselect one to choose another.
          </p>
        ) : null}
        {fieldErrors.architectureConcerns ? (
          <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{fieldErrors.architectureConcerns}</p>
        ) : null}
      </fieldset>
    </div>
  );
}
