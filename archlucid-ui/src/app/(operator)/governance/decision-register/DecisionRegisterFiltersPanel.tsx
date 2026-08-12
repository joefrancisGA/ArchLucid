"use client";

import { cn } from "@/lib/utils";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";

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

const CONFIDENCE_BASIS_OPTIONS = ["Evidence-backed", "Model-assisted", "Unknown"] as const;

const inputClassName =
  "rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950";

type DecisionRegisterFiltersPanelProps = {
  readonly category: string;
  readonly recordedAfter: string;
  readonly recordedBefore: string;
  readonly minConfidence: string;
  readonly maxConfidence: string;
  readonly confidenceBasis: string;
  readonly datePreset: DecisionRegisterDatePreset;
  readonly collapseAdvanced: boolean;
  readonly onCategoryChange: (value: string) => void;
  readonly onRecordedAfterChange: (value: string) => void;
  readonly onRecordedBeforeChange: (value: string) => void;
  readonly onMinConfidenceChange: (value: string) => void;
  readonly onMaxConfidenceChange: (value: string) => void;
  readonly onConfidenceBasisChange: (value: string) => void;
  readonly onDatePresetChange: (preset: DecisionRegisterDatePreset) => void;
  readonly onClearFilters: () => void;
};

function DatePresetButton(props: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}): React.JSX.Element {
  return (
    <Button type="button" variant={props.active ? "primary" : "outline"} size="sm" onClick={props.onClick}>
      {props.label}
    </Button>
  );
}

export function DecisionRegisterFiltersPanel(props: DecisionRegisterFiltersPanelProps): React.JSX.Element {
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
        <select
          className={inputClassName}
          value={props.confidenceBasis}
          onChange={(event) => {
            props.onConfidenceBasisChange(event.target.value);
          }}
        >
          <option value="">Any</option>
          {CONFIDENCE_BASIS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <Card data-testid="decision-register-filters">
      <CardHeader className="space-y-3">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{DECISION_REGISTER_FILTERS_TITLE}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <DatePresetButton
            active={props.datePreset === "30"}
            label={DECISION_REGISTER_DATE_PRESET_30_LABEL}
            onClick={() => {
              props.onDatePresetChange("30");
            }}
          />
          <DatePresetButton
            active={props.datePreset === "90"}
            label={DECISION_REGISTER_DATE_PRESET_90_LABEL}
            onClick={() => {
              props.onDatePresetChange("90");
            }}
          />
          <DatePresetButton
            active={props.datePreset === "all"}
            label={DECISION_REGISTER_DATE_PRESET_ALL_LABEL}
            onClick={() => {
              props.onDatePresetChange("all");
            }}
          />
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
        </div>
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
          <CollapsibleSection title={DECISION_REGISTER_ADVANCED_FILTERS_TITLE} defaultOpen={false} sectionTestId="decision-register-advanced-filters">
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
