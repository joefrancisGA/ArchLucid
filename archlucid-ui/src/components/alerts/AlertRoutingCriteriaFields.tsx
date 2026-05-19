"use client";

import type { AlertRoutingCriteria } from "@/lib/alert-routing-criteria";
import {
  ALERT_ROUTING_FINDING_TYPE_OPTIONS,
  ALERT_ROUTING_SEVERITY_OPTIONS,
  formatTagsInput,
  parseTagsInput,
} from "@/lib/alert-routing-criteria";
import { cn } from "@/lib/utils";

export type AlertRoutingCriteriaFieldsProps = {
  criteria: AlertRoutingCriteria;
  onChange: (criteria: AlertRoutingCriteria) => void;
  disabled?: boolean;
  disabledTitle?: string;
};

function toggleValue(list: string[], value: string): string[] {
  if (list.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
    return list.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
  }

  return [...list, value];
}

/**
 * Optional severity / finding-type / tag filters for alert routing subscriptions.
 */
export function AlertRoutingCriteriaFields({
  criteria,
  onChange,
  disabled = false,
  disabledTitle,
}: AlertRoutingCriteriaFieldsProps) {
  return (
    <fieldset className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700" disabled={disabled}>
      <legend className="px-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">Routing filters (optional)</legend>
      <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
        Leave empty to route on minimum severity only. Finding types match the alert category. Tags match alert tags
        (include <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-800">tags:phi,prod</code> in trigger
        values or the alert category).
      </p>

      <div>
        <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Severities
        </p>
        <div className="flex flex-wrap gap-2">
          {ALERT_ROUTING_SEVERITY_OPTIONS.map((severity) => {
            const selected = criteria.severities.some((entry) => entry.toLowerCase() === severity.toLowerCase());

            return (
              <label
                key={severity}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs",
                  selected
                    ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                    : "border-neutral-300 dark:border-neutral-600",
                )}
                title={disabled ? disabledTitle : undefined}
              >
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={selected}
                  disabled={disabled}
                  onChange={() =>
                    onChange({
                      ...criteria,
                      severities: toggleValue(criteria.severities, severity),
                    })
                  }
                />
                {severity}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Finding types / categories
        </p>
        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {ALERT_ROUTING_FINDING_TYPE_OPTIONS.map((findingType) => {
            const selected = criteria.findingTypes.some(
              (entry) => entry.toLowerCase() === findingType.toLowerCase(),
            );

            return (
              <label
                key={findingType}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs",
                  selected
                    ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                    : "border-neutral-300 dark:border-neutral-600",
                )}
                title={disabled ? disabledTitle : undefined}
              >
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  checked={selected}
                  disabled={disabled}
                  onChange={() =>
                    onChange({
                      ...criteria,
                      findingTypes: toggleValue(criteria.findingTypes, findingType),
                    })
                  }
                />
                {findingType}
              </label>
            );
          })}
        </div>
      </div>

      <label className="block text-sm text-neutral-700 dark:text-neutral-300">
        Tags (comma-separated)
        <input
          value={formatTagsInput(criteria.tags)}
          onChange={(e) =>
            onChange({
              ...criteria,
              tags: parseTagsInput(e.target.value),
            })
          }
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
          placeholder="phi, production, security-review"
          className="mt-1 block w-full p-2 font-mono text-sm"
          data-testid="alert-routing-tags-input"
        />
      </label>
    </fieldset>
  );
}
