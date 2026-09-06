"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";
import { decisionRegisterDatePresetHrefFromSearch } from "@/lib/governance/decision-register-date-range-url";
import {
  DECISION_REGISTER_CONFIDENCE_BASIS_OPTIONS,
  decisionRegisterConfidenceBasisHrefFromSearch,
  type DecisionRegisterConfidenceBasisFilter,
} from "@/lib/governance/decision-register-advanced-filters-url";
import {
  decisionRegisterAdvancedFiltersDisclosureHrefFromSearch,
  parseDecisionRegisterAdvancedFiltersOpenFromSearch,
} from "@/lib/governance/decision-register-advanced-filters-disclosure-url";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

import {
  DECISION_REGISTER_ADVANCED_FILTERS_TITLE,
  DECISION_REGISTER_CATEGORY_LABEL,
  DECISION_REGISTER_CLEAR_FILTERS_LABEL,
  DECISION_REGISTER_CONFIDENCE_BASIS_HELPER,
  DECISION_REGISTER_CONFIDENCE_BASIS_LABEL,
  DECISION_REGISTER_DATE_PRESET_30_LABEL,
  DECISION_REGISTER_DATE_PRESET_90_LABEL,
  DECISION_REGISTER_DATE_PRESET_ALL_LABEL,
  DECISION_REGISTER_DATE_RANGE_ALL_CHIP,
  DECISION_REGISTER_DATE_RANGE_RECORDED_HELPER,
  DECISION_REGISTER_FILTERS_TITLE,
  DECISION_REGISTER_MAX_CONFIDENCE_LABEL,
  DECISION_REGISTER_MIN_CONFIDENCE_LABEL,
} from "./decision-register-copy";
import type { DecisionRegisterDatePreset } from "./decision-register-date-range";

const CONFIDENCE_BASIS_OPTIONS = DECISION_REGISTER_CONFIDENCE_BASIS_OPTIONS;

const DATE_PRESET_OPTIONS: ReadonlyArray<{ readonly id: DecisionRegisterDatePreset; readonly label: string }> = [
  { id: "30", label: DECISION_REGISTER_DATE_PRESET_30_LABEL },
  { id: "90", label: DECISION_REGISTER_DATE_PRESET_90_LABEL },
  { id: "all", label: DECISION_REGISTER_DATE_PRESET_ALL_LABEL },
];

const inputClassName =
  "rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950";

type DecisionRegisterFiltersPanelProps = {
  readonly category: string;
  readonly recordedAfter: string;
  readonly recordedBefore: string;
  readonly minConfidence: string;
  readonly maxConfidence: string;
  readonly confidenceBasis: DecisionRegisterConfidenceBasisFilter;
  readonly datePreset: DecisionRegisterDatePreset;
  readonly currentSearch: string;
  readonly collapseAdvanced: boolean;
  readonly onCategoryChange: (value: string) => void;
  readonly onRecordedAfterChange: (value: string) => void;
  readonly onRecordedBeforeChange: (value: string) => void;
  readonly onMinConfidenceChange: (value: string) => void;
  readonly onMaxConfidenceChange: (value: string) => void;
  readonly onConfidenceBasisChange: (value: DecisionRegisterConfidenceBasisFilter) => void;
  readonly onClearFilters: () => void;
};

export function DecisionRegisterFiltersPanel(props: DecisionRegisterFiltersPanelProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_DECISION_REGISTER_PATH;
  const searchParams = useSearchParams();
  const decisionRegisterAdvancedFiltersOpenParam = searchParams.get("decisionRegisterAdvancedFiltersOpen");
  const [advancedFiltersOpen, setAdvancedFiltersOpenState] = useState(() =>
    parseDecisionRegisterAdvancedFiltersOpenFromSearch(decisionRegisterAdvancedFiltersOpenParam),
  );

  const syncAdvancedFiltersOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        decisionRegisterAdvancedFiltersDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setAdvancedFiltersOpen = useCallback(
    (open: boolean) => {
      setAdvancedFiltersOpenState(open);
      syncAdvancedFiltersOpenToUrl(open);
    },
    [syncAdvancedFiltersOpenToUrl],
  );

  useEffect(() => {
    setAdvancedFiltersOpenState(parseDecisionRegisterAdvancedFiltersOpenFromSearch(decisionRegisterAdvancedFiltersOpenParam));
  }, [decisionRegisterAdvancedFiltersOpenParam]);

  const advancedFilters = (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium">{DECISION_REGISTER_MIN_CONFIDENCE_LABEL}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          className={inputClassName}
          value={props.minConfidence}
          onChange={(event) => {
            props.onMinConfidenceChange(event.target.value);
          }}
        />
      </label>
      <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium">{DECISION_REGISTER_MAX_CONFIDENCE_LABEL}</span>
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          className={inputClassName}
          value={props.maxConfidence}
          onChange={(event) => {
            props.onMaxConfidenceChange(event.target.value);
          }}
        />
      </label>
      <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium">{DECISION_REGISTER_CONFIDENCE_BASIS_LABEL}</span>
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{DECISION_REGISTER_CONFIDENCE_BASIS_HELPER}</span>
        <FilterChipGroup aria-label="Confidence basis" className="flex flex-wrap gap-2">
          <FilterChip
            href={decisionRegisterConfidenceBasisHrefFromSearch(props.currentSearch, "", GOVERNANCE_DECISION_REGISTER_PATH)}
            scroll={false}
            className={buyerFilterChipClass(props.confidenceBasis.length === 0, false)}
            aria-current={props.confidenceBasis.length === 0 ? "page" : undefined}
            data-testid="decision-register-basis-any"
          >
            Any
          </FilterChip>
          {CONFIDENCE_BASIS_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={decisionRegisterConfidenceBasisHrefFromSearch(
                props.currentSearch,
                option as DecisionRegisterConfidenceBasisFilter,
                GOVERNANCE_DECISION_REGISTER_PATH,
              )}
              scroll={false}
              className={buyerFilterChipClass(props.confidenceBasis === option, false)}
              aria-current={props.confidenceBasis === option ? "page" : undefined}
              data-testid={`decision-register-basis-${option.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </label>
    </div>
  );

  return (
    <Card data-testid="decision-register-filters">
      <CardHeader className="space-y-3">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{DECISION_REGISTER_FILTERS_TITLE}</CardTitle>
        <FilterChipGroup aria-label="Decision register date range" className="flex flex-wrap items-center gap-2">
          {DATE_PRESET_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              href={decisionRegisterDatePresetHrefFromSearch(
                props.currentSearch,
                option.id,
                GOVERNANCE_DECISION_REGISTER_PATH,
              )}
              scroll={false}
              className={buyerFilterChipClass(props.datePreset === option.id, false)}
              aria-current={props.datePreset === option.id ? "page" : undefined}
              aria-label={`Date range: ${option.label}`}
              data-testid={`decision-register-date-preset-${option.id}`}
            >
              {option.label}
            </FilterChip>
          ))}
          {props.datePreset === "all" ? (
            <span
              className={cn(
                "rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/50",
                OPERATOR_TYPOGRAPHY.helper,
              )}
              data-testid="decision-register-date-range-all-chip"
            >
              {DECISION_REGISTER_DATE_RANGE_ALL_CHIP}
            </span>
          ) : null}
        </FilterChipGroup>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className={cn("grid max-w-md gap-1", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-medium">{DECISION_REGISTER_CATEGORY_LABEL}</span>
          <input
            className={inputClassName}
            value={props.category}
            onChange={(event) => {
              props.onCategoryChange(event.target.value);
            }}
          />
        </label>

        <div className="space-y-1">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{DECISION_REGISTER_DATE_RANGE_RECORDED_HELPER}</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium">{OPERATOR_DATE_RANGE_START_LABEL}</span>
              <input
                type="date"
                className={cn(inputClassName, OPERATOR_DATE_RANGE_INPUT_CLASSNAME)}
                value={props.recordedAfter}
                onChange={(event) => {
                  props.onRecordedAfterChange(event.target.value);
                }}
              />
            </label>
            <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium">{OPERATOR_DATE_RANGE_END_LABEL}</span>
              <input
                type="date"
                className={cn(inputClassName, OPERATOR_DATE_RANGE_INPUT_CLASSNAME)}
                value={props.recordedBefore}
                onChange={(event) => {
                  props.onRecordedBeforeChange(event.target.value);
                }}
              />
            </label>
          </div>
        </div>

        {props.collapseAdvanced ? (
          <CollapsibleSection
            title={DECISION_REGISTER_ADVANCED_FILTERS_TITLE}
            open={advancedFiltersOpen}
            onToggle={setAdvancedFiltersOpen}
            sectionTestId="decision-register-advanced-filters"
          >
            {advancedFilters}
          </CollapsibleSection>
        ) : (
          <section aria-label={DECISION_REGISTER_ADVANCED_FILTERS_TITLE}>{advancedFilters}</section>
        )}

        <div>
          <Button type="button" variant="outline" size="sm" data-testid="decision-register-clear-filters" onClick={props.onClearFilters}>
            {DECISION_REGISTER_CLEAR_FILTERS_LABEL}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
