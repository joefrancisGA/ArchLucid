"use client";

import { useEffect, useRef, useState } from "react";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isShowcaseDemoRunId } from "@/lib/graph-page-state";
import { BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT } from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";
import {
  ASK_WORKSPACE_ALL_REVIEWS_VALUE,
  operatorAllowsSyntheticAskRunPick,
} from "@/components/ask-run-id-picker-helpers";
import { AskRunIdPickerFieldLabel, AskRunIdPickerFieldStack } from "@/components/AskRunIdPickerFieldLabel";
import {
  AskRunIdPickerEmptyListSelect,
  AskRunIdPickerSyntheticSelect,
  AskRunIdPickerUnavailableSelect,
  BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT,
} from "@/components/AskRunIdPickerListStates";
import { AskRunIdPickerReviewListSelect } from "@/components/AskRunIdPickerReviewListSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export { ASK_WORKSPACE_ALL_REVIEWS_VALUE };

export type AskRunIdPickerProps = {
  readonly value: string;
  readonly onChange: (runId: string) => void;
  readonly selectedThreadId: string;
  /**
   * When false, do not auto-select the demo / first listed run while `value` is empty — use for paired compare/base pickers.
   * Defaults to true.
   */
  readonly preferAutoPick?: boolean;
  /** When true, only committed runs are listed (capped at 20). */
  readonly committedOnly?: boolean;
  readonly label?: string;
  /** When true, the control cannot be changed (e.g. read-only governance submit at Reader rank). */
  readonly disabled?: boolean;
  /** Stable DOM id suffix so multiple pickers avoid duplicate ids (defaults to primary run field). */
  readonly fieldId?: string;
  /** Overrides the disabled-select placeholder when the reviews list cannot be loaded. */
  readonly reviewsLoadErrorPlaceholder?: string;
  /** Overrides the helper line shown under the picker when the reviews list cannot be loaded. */
  readonly reviewsLoadErrorHint?: string;
  /** Notifies parents when list availability changes — avoids duplicate downstream error surfaces. */
  readonly onListAvailabilityChange?: (state: {
    readonly loadError: boolean;
    readonly loading: boolean;
    readonly packageCount: number;
    readonly usingSyntheticSample: boolean;
  }) => void;
  /**
   * When false, do not auto-select the showcase sample when the workspace has zero reviews.
   * Real packages from the list can still auto-select when {@link preferAutoPick} is true.
   */
  readonly autoSelectSyntheticSample?: boolean;
  readonly syntheticSampleHint?: string;
  readonly syntheticLoadErrorHint?: string;
  readonly emptyListPlaceholder?: string;
  readonly emptyListHint?: string;
  /** When true, omit helper copy under the field — parent empty state or status line owns messaging. */
  readonly hideFieldHelper?: boolean;
};

/**
 * Loads recent runs for the default project and prefers a combobox over raw IDs.
 * When the list is empty or unavailable, renders a disabled selector plus guidance — not a paste-ID field.
 */
export function AskRunIdPicker(props: AskRunIdPickerProps) {
  const {
    value,
    onChange,
    selectedThreadId,
    preferAutoPick = true,
    label,
    fieldId,
    disabled = false,
    committedOnly = false,
    reviewsLoadErrorPlaceholder,
    reviewsLoadErrorHint,
    onListAvailabilityChange,
    autoSelectSyntheticSample = true,
    syntheticSampleHint,
    syntheticLoadErrorHint,
    emptyListPlaceholder,
    emptyListHint,
    hideFieldHelper = false,
  } = props;
  const { isWorkingMode } = useWorkspaceMode();
  const allowsSyntheticAskRunPick = operatorAllowsSyntheticAskRunPick(isWorkingMode);
  const [items, setItems] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const labelText = label ?? "Review";
  const controlIdPrefix = fieldId ?? "ask-run-primary";
  const selectControlId = `${controlIdPrefix}-select`;
  const reviewsUnavailablePlaceholder = reviewsLoadErrorPlaceholder ?? "Reviews unavailable";
  const reviewsUnavailableHint = reviewsLoadErrorHint ?? "Check workspace setup or retry.";
  const syntheticSampleHintText =
    syntheticSampleHint ??
    "No completed reviews are available yet. You can start a new review or explore the illustrative Claims Intake sample graph (not your tenant data).";
  const syntheticLoadErrorHintText =
    syntheticLoadErrorHint ?? BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT;
  const emptyListPlaceholderText = emptyListPlaceholder ?? "No completed reviews yet";
  const emptyListHintText = emptyListHint ?? BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT;

  const onListAvailabilityChangeRef = useRef(onListAvailabilityChange);
  onListAvailabilityChangeRef.current = onListAvailabilityChange;

  useEffect(() => {
    const usingSyntheticSample =
      isShowcaseDemoRunId(value) ||
      (!loading &&
        !loadError &&
        items.length === 0 &&
        allowsSyntheticAskRunPick &&
        preferAutoPick &&
        autoSelectSyntheticSample &&
        value.trim().length > 0);

    onListAvailabilityChangeRef.current?.({
      loadError,
      loading,
      packageCount: items.length,
      usingSyntheticSample,
    });
  }, [allowsSyntheticAskRunPick, autoSelectSyntheticSample, items.length, loadError, loading, preferAutoPick, value]);

  const { data: projectRunsData, isLoading: projectRunsLoading, isError: projectRunsError } =
    useAskProjectRunsQuery("default", { committedOnly });

  useEffect(() => {
    setItems(projectRunsData?.items ?? []);
    setLoadError(projectRunsData?.loadError ?? projectRunsError);
    setLoading(projectRunsLoading);
  }, [projectRunsData, projectRunsError, projectRunsLoading]);

  useEffect(() => {
    if (!preferAutoPick) {
      return;
    }

    if (loading) {
      return;
    }

    if (value.trim().length > 0) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    const demoPreferred =
      items.find((r) => r.runId === SHOWCASE_STATIC_DEMO_RUN_ID) ??
      items.find((r) => r.runId === SHOWCASE_STATIC_DEMO_RUN_ID);

    const firstItem = items[0];

    if (demoPreferred !== undefined) {
      onChange(demoPreferred.runId);

      return;
    }

    if (items.length === 1 && firstItem !== undefined) {
      onChange(firstItem.runId);

      return;
    }
  }, [loading, items, value, onChange, preferAutoPick]);

  useEffect(() => {
    if (!preferAutoPick) {
      return;
    }

    if (loading || loadError) {
      return;
    }

    if (!allowsSyntheticAskRunPick || items.length > 0) {
      return;
    }

    if (!autoSelectSyntheticSample) {
      return;
    }

    if (value.trim().length > 0) {
      return;
    }

    onChange(SHOWCASE_STATIC_DEMO_RUN_ID);
  }, [allowsSyntheticAskRunPick, autoSelectSyntheticSample, loading, loadError, items, preferAutoPick, value, onChange]);

  useEffect(() => {
    if (!loadError) {
      return;
    }

    if (!preferAutoPick) {
      return;
    }

    if (!allowsSyntheticAskRunPick) {
      return;
    }

    if (!autoSelectSyntheticSample) {
      return;
    }

    if (value.trim().length > 0) {
      return;
    }

    onChange(SHOWCASE_STATIC_DEMO_RUN_ID);
  }, [allowsSyntheticAskRunPick, autoSelectSyntheticSample, loadError, preferAutoPick, value, onChange]);

  const trimmedValue = value.trim();
  const reviewFieldLabel = (
    <AskRunIdPickerFieldLabel
      labelText={labelText}
      selectControlId={selectControlId}
      trimmedValue={trimmedValue}
      selectedThreadId={selectedThreadId}
    />
  );

  if (loadError) {
    if (allowsSyntheticAskRunPick) {
      return (
        <AskRunIdPickerSyntheticSelect
          value={value}
          onChange={onChange}
          selectControlId={selectControlId}
          disabled={disabled}
          reviewFieldLabel={reviewFieldLabel}
          hideFieldHelper={hideFieldHelper}
          helperText={syntheticLoadErrorHintText}
        />
      );
    }

    return (
      <AskRunIdPickerUnavailableSelect
        value={value}
        selectControlId={selectControlId}
        reviewFieldLabel={reviewFieldLabel}
        hideFieldHelper={hideFieldHelper}
        placeholder={reviewsUnavailablePlaceholder}
        hint={reviewsUnavailableHint}
      />
    );
  }

  if (loading) {
    const hasDeepLinkValue = trimmedValue.length > 0;

    return (
      <AskRunIdPickerFieldStack reviewFieldLabel={reviewFieldLabel}>
        <Select disabled value={hasDeepLinkValue ? trimmedValue : undefined}>
          <SelectTrigger id={selectControlId} className="font-mono">
            <SelectValue placeholder="Loading reviews…" />
          </SelectTrigger>
          {hasDeepLinkValue ? (
            <SelectContent>
              <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem>
            </SelectContent>
          ) : null}
        </Select>
      </AskRunIdPickerFieldStack>
    );
  }

  if (items.length === 0) {
    const allowSyntheticPick = allowsSyntheticAskRunPick && preferAutoPick;

    if (allowSyntheticPick) {
      return (
        <AskRunIdPickerSyntheticSelect
          value={value}
          onChange={onChange}
          selectControlId={selectControlId}
          disabled={disabled}
          reviewFieldLabel={reviewFieldLabel}
          hideFieldHelper={hideFieldHelper}
          helperText={syntheticSampleHintText}
          forceSyntheticValue={trimmedValue.length === 0 || isShowcaseDemoRunId(trimmedValue)}
        />
      );
    }

    return (
      <AskRunIdPickerEmptyListSelect
        value={value}
        selectControlId={selectControlId}
        reviewFieldLabel={reviewFieldLabel}
        hideFieldHelper={hideFieldHelper}
        emptyListPlaceholder={emptyListPlaceholderText}
        emptyListHint={emptyListHintText}
      />
    );
  }

  return (
    <AskRunIdPickerFieldStack reviewFieldLabel={reviewFieldLabel}>
      <AskRunIdPickerReviewListSelect
        value={value}
        onChange={onChange}
        items={items}
        selectControlId={selectControlId}
        disabled={disabled}
      />
    </AskRunIdPickerFieldStack>
  );
}
