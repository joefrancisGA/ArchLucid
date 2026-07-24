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

export type QuickScanFormProps = {
  values: QuickScanFormValues;
  fieldErrors: QuickScanFieldErrors;
  disabled?: boolean;
  onChange: (values: QuickScanFormValues) => void;
};

export function QuickScanForm({ values, fieldErrors, disabled = false, onChange }: QuickScanFormProps): ReactElement {
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

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="quick-scan-system-name">
          System name <span className="text-neutral-500">(required)</span>
        </label>
        <input
          id="quick-scan-system-name"
          type="text"
          value={values.systemName}
          maxLength={QUICK_SCAN_MAX_SYSTEM_NAME}
          disabled={disabled}
          aria-invalid={fieldErrors.systemName !== undefined}
          aria-describedby={fieldErrors.systemName ? "quick-scan-system-name-error" : undefined}
          onChange={(event) => onChange({ ...values, systemName: event.target.value })}
          autoComplete="off"
          className="w-full max-w-xl rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
          placeholder="Claims intake API"
        />
        {fieldErrors.systemName ? (
          <p id="quick-scan-system-name-error" className="text-sm text-rose-700 dark:text-rose-300">
            {fieldErrors.systemName}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="quick-scan-primary-environment">
          Primary environment <span className="text-neutral-500">(required)</span>
        </label>
        <select
          id="quick-scan-primary-environment"
          value={values.primaryEnvironment}
          disabled={disabled}
          aria-invalid={fieldErrors.primaryEnvironment !== undefined}
          aria-describedby={fieldErrors.primaryEnvironment ? "quick-scan-primary-environment-error" : undefined}
          onChange={(event) =>
            onChange({
              ...values,
              primaryEnvironment: event.target.value as QuickScanFormValues["primaryEnvironment"],
              primaryEnvironmentOther: event.target.value === "Other" ? values.primaryEnvironmentOther : "",
            })
          }
          className="w-full max-w-xl rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
        >
          <option value="">Select an environment</option>
          {QUICK_SCAN_PRIMARY_ENVIRONMENTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors.primaryEnvironment ? (
          <p id="quick-scan-primary-environment-error" className="text-sm text-rose-700 dark:text-rose-300">
            {fieldErrors.primaryEnvironment}
          </p>
        ) : null}
      </div>

      {values.primaryEnvironment === "Other" ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="quick-scan-environment-other">
            Other environment <span className="text-neutral-500 dark:text-neutral-400">(optional)</span>
          </label>
          <input
            id="quick-scan-environment-other"
            type="text"
            value={values.primaryEnvironmentOther}
            disabled={disabled}
            onChange={(event) => onChange({ ...values, primaryEnvironmentOther: event.target.value })}
            className="w-full max-w-xl rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            placeholder="Describe the hosting environment"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex max-w-xl items-center justify-between gap-3">
          <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="quick-scan-description">
            Describe the system <span className="text-neutral-500">(required)</span>
          </label>
          <span className="text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
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
          onChange={(event) => onChange({ ...values, description: event.target.value })}
          className="w-full max-w-xl rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
          placeholder="Scope, components, integrations, constraints, and operational context…"
        />
        {fieldErrors.description ? (
          <p id="quick-scan-description-error" className="text-sm text-rose-700 dark:text-rose-300">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Optional architecture concerns <span className="text-neutral-500">(up to {QUICK_SCAN_MAX_CONCERNS})</span>
        </legend>
        <div className="flex max-w-xl flex-wrap gap-2">
          {QUICK_SCAN_ARCHITECTURE_CONCERNS.map((concern) => {
            const selected = values.architectureConcerns.includes(concern.value);

            return (
              <label
                key={concern.value}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  selected
                    ? "border-sky-600 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100"
                    : "border-neutral-300 text-neutral-800 dark:border-neutral-600 dark:text-neutral-100"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected}
                  disabled={disabled || (!selected && values.architectureConcerns.length >= QUICK_SCAN_MAX_CONCERNS)}
                  onChange={() => toggleConcern(concern.value)}
                />
                {concern.label}
              </label>
            );
          })}
        </div>
        {fieldErrors.architectureConcerns ? (
          <p className="text-sm text-rose-700 dark:text-rose-300">{fieldErrors.architectureConcerns}</p>
        ) : null}
      </fieldset>
    </form>
  );
}
