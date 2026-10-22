"use client";

import { cn } from "@/lib/utils";
import { useId, useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AlertRoutingCriteria } from "@/lib/alert-routing-criteria";
import { ALERT_ROUTING_SEVERITY_OPTIONS } from "@/lib/alert-routing-criteria";
import {
  ALERT_ROUTING_ADVANCED_FINDING_TYPES,
  ALERT_ROUTING_COMMON_FINDING_TYPES,
  descriptionForAlertRoutingFindingType,
} from "@/lib/alert-routing-finding-type-labels";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ReviewLabelTokenInput } from "@/components/alerts/ReviewLabelTokenInput";
import {
  alertRoutingCriteriaHrefFromSearch,
  parseAlertRoutingAdvancedOpenFromSearch,
  parseAlertRoutingExactSeveritiesOpenFromSearch,
} from "@/lib/alerts/alert-routing-criteria-url";

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

function FindingTypeCheckbox({
  value,
  label,
  description,
  selected,
  disabled,
  onToggle,
}: {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const descriptionId = description ? `${value}-description` : undefined;

  return (
    <label
      className={cn(
        "inline-flex min-h-9 cursor-pointer items-start gap-2 rounded border px-2 py-1.5",
        OPERATOR_TYPOGRAPHY.badge,
        selected
          ? "border-neutral-400 bg-[var(--al-layer-hover)] text-al-text-primary dark:border-neutral-500 dark:bg-neutral-800/80"
          : "border-neutral-300 dark:border-neutral-600",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4"
        checked={selected}
        disabled={disabled}
        aria-describedby={descriptionId}
        onChange={onToggle}
      />
      <span>
        <span className="block">{label}</span>
        {description ? (
          <span id={descriptionId} className={cn("block text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * Optional finding-category and review-label filters for notification destinations.
 */
export function AlertRoutingCriteriaFields({
  criteria,
  onChange,
  disabled = false,
  disabledTitle,
}: AlertRoutingCriteriaFieldsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const alertRoutingAdvancedOpenParam = searchParams.get("alertRoutingAdvancedOpen");
  const alertRoutingExactSeveritiesOpenParam = searchParams.get("alertRoutingExactSeveritiesOpen");
  const [showAdvancedCategories, setShowAdvancedCategoriesState] = useState(() =>
    parseAlertRoutingAdvancedOpenFromSearch(alertRoutingAdvancedOpenParam),
  );
  const [showExactSeverities, setShowExactSeveritiesState] = useState(
    () =>
      parseAlertRoutingExactSeveritiesOpenFromSearch(alertRoutingExactSeveritiesOpenParam) ||
      criteria.severities.length > 0,
  );
  const reviewLabelsHelperId = useId();
  const reviewLabelsInputId = useId();

  const syncCriteriaPanelsToUrl = useCallback(
    (next: { showAdvancedCategories: boolean; showExactSeverities: boolean }) => {
      router.replace(
        alertRoutingCriteriaHrefFromSearch(searchParams.toString(), next, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setShowAdvancedCategories = useCallback(
    (value: boolean) => {
      setShowAdvancedCategoriesState(value);
      syncCriteriaPanelsToUrl({ showAdvancedCategories: value, showExactSeverities });
    },
    [showExactSeverities, syncCriteriaPanelsToUrl],
  );

  const setShowExactSeverities = useCallback(
    (value: boolean) => {
      setShowExactSeveritiesState(value);
      syncCriteriaPanelsToUrl({ showAdvancedCategories, showExactSeverities: value });
    },
    [showAdvancedCategories, syncCriteriaPanelsToUrl],
  );

  useEffect(() => {
    setShowAdvancedCategoriesState(parseAlertRoutingAdvancedOpenFromSearch(alertRoutingAdvancedOpenParam));
  }, [alertRoutingAdvancedOpenParam]);

  useEffect(() => {
    if (alertRoutingExactSeveritiesOpenParam !== null) {
      setShowExactSeveritiesState(parseAlertRoutingExactSeveritiesOpenFromSearch(alertRoutingExactSeveritiesOpenParam));
    }
  }, [alertRoutingExactSeveritiesOpenParam]);

  return (
    <div className="space-y-5">
      {disabled && disabledTitle ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {disabledTitle}
        </p>
      ) : null}

      {showExactSeverities ? (
        <fieldset className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700" disabled={disabled}>
          <legend className={cn("px-1 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Customize exact severities
          </legend>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            When selected, only alerts at these severities are delivered — overriding the minimum severity preview above.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALERT_ROUTING_SEVERITY_OPTIONS.map((severity) => {
              const selected = criteria.severities.some((entry) => entry.toLowerCase() === severity.toLowerCase());

              return (
                <label
                  key={severity}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded border px-2 py-1.5",
                    OPERATOR_TYPOGRAPHY.badge,
                    selected
                      ? "border-neutral-400 bg-[var(--al-layer-hover)] text-al-text-primary dark:border-neutral-500 dark:bg-neutral-800/80"
                      : "border-neutral-300 dark:border-neutral-600",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
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
        </fieldset>
      ) : (
        <button
          type="button"
          className={cn(
            OPERATOR_LINK.nav,
            "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
            OPERATOR_TYPOGRAPHY.body,
          )}
          disabled={disabled}
          onClick={() => setShowExactSeverities(true)}
        >
          Customize exact severities
        </button>
      )}

      <fieldset className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700" disabled={disabled}>
        <legend className={cn("px-1 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          Optional filters
        </legend>

        <div>
          <p className={cn("m-0 mb-2 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Finding categories
          </p>
          <p className={cn("m-0 mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Leave all unchecked to include every category that meets the severity threshold.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALERT_ROUTING_COMMON_FINDING_TYPES.map((entry) => (
              <FindingTypeCheckbox
                key={entry.value}
                value={entry.value}
                label={entry.label}
                description={entry.description}
                selected={criteria.findingTypes.some(
                  (findingType) => findingType.toLowerCase() === entry.value.toLowerCase(),
                )}
                disabled={disabled}
                onToggle={() =>
                  onChange({
                    ...criteria,
                    findingTypes: toggleValue(criteria.findingTypes, entry.value),
                  })
                }
              />
            ))}
          </div>
          {showAdvancedCategories ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {ALERT_ROUTING_ADVANCED_FINDING_TYPES.map((entry) => (
                <FindingTypeCheckbox
                  key={entry.value}
                  value={entry.value}
                  label={entry.label}
                  description={entry.description ?? descriptionForAlertRoutingFindingType(entry.value)}
                  selected={criteria.findingTypes.some(
                    (findingType) => findingType.toLowerCase() === entry.value.toLowerCase(),
                  )}
                  disabled={disabled}
                  onToggle={() =>
                    onChange({
                      ...criteria,
                      findingTypes: toggleValue(criteria.findingTypes, entry.value),
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                OPERATOR_LINK.nav,
                "mt-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
                OPERATOR_TYPOGRAPHY.body,
              )}
              disabled={disabled}
              onClick={() => setShowAdvancedCategories(true)}
            >
              Show advanced categories
            </button>
          )}
        </div>

        <div>
          <label
            htmlFor={reviewLabelsInputId}
            className={cn("mb-1 block font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
          >
            Only notify for reviews with these labels
          </label>
          <p id={reviewLabelsHelperId} className={cn("m-0 mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Leave empty to include all reviews. When labels are selected, the alert is sent when a review contains any
            selected label. Labels are matched case-insensitively. Add labels from your review metadata such as
            Production, PHI, or Security review.
          </p>
          <ReviewLabelTokenInput
            labels={criteria.tags}
            onChange={(tags) => onChange({ ...criteria, tags })}
            disabled={disabled}
            describedById={reviewLabelsHelperId}
            inputId={reviewLabelsInputId}
          />
        </div>
      </fieldset>
    </div>
  );
}
