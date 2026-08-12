"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator/operator-static-demo";
import { isShowcaseDemoRunId } from "@/lib/graph-page-state";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT,
  BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL,
  BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function findRunSummaryById(items: readonly RunSummary[], runId: string): RunSummary | undefined {
  const needle = runId.trim().toLowerCase();

  if (needle.length === 0) {
    return undefined;
  }

  return items.find((row) => (row.runId ?? "").trim().toLowerCase() === needle);
}

function operatorAllowsSyntheticAskRunPick(): boolean {
  return (
    isBuyerPolishedOperatorShellEnv() ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    shouldMergeOperatorDemoAlertSample()
  );
}

/** Legacy slug still appearing in bookmarks — canonical id is {@link SHOWCASE_STATIC_DEMO_RUN_ID}. */
const DEMO_RUN_PREF_ID = "claims-intake-modernization";

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
        operatorAllowsSyntheticAskRunPick() &&
        preferAutoPick &&
        autoSelectSyntheticSample &&
        value.trim().length > 0);

    onListAvailabilityChangeRef.current?.({
      loadError,
      loading,
      packageCount: items.length,
      usingSyntheticSample,
    });
  }, [autoSelectSyntheticSample, items.length, loadError, loading, preferAutoPick, value]);

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
      items.find((r) => r.runId === DEMO_RUN_PREF_ID);

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

  /**
   * Demo fallback lists zero runs without API error — keep parent state in sync so Graph / Governance receive a run id.
   * Without this, the Select displays the synthetic row while `value` stays empty upstream.
   */
  useEffect(() => {
    if (!preferAutoPick) {
      return;
    }

    if (loading || loadError) {
      return;
    }

    const allowSyntheticPick = operatorAllowsSyntheticAskRunPick();

    if (!allowSyntheticPick || items.length > 0) {
      return;
    }

    if (!autoSelectSyntheticSample) {
      return;
    }

    if (value.trim().length > 0) {
      return;
    }

    onChange(SHOWCASE_STATIC_DEMO_RUN_ID);
  }, [autoSelectSyntheticSample, loading, loadError, items, preferAutoPick, value, onChange]);

  useEffect(() => {
    if (!loadError) {
      return;
    }

    if (!preferAutoPick) {
      return;
    }

    if (!operatorAllowsSyntheticAskRunPick()) {
      return;
    }

    if (!autoSelectSyntheticSample) {
      return;
    }

    if (value.trim().length > 0) {
      return;
    }

    onChange(SHOWCASE_STATIC_DEMO_RUN_ID);
  }, [autoSelectSyntheticSample, loadError, preferAutoPick, value, onChange]);

  const trimmedValue = value.trim();
  // TB-2101: empty-state prompt lives on SelectValue placeholder, not the label.
  const optionalHint =
    trimmedValue.length > 0
      ? null
      : selectedThreadId.trim().length > 0
        ? "(optional when a conversation already has review context)"
        : null;

  const reviewFieldLabel = (
    <Label htmlFor={selectControlId} data-testid="ask-run-id-picker-label">
      {labelText}
      {optionalHint !== null ? (
        <>
          {" "}
          <span className="font-normal text-al-text-secondary">{optionalHint}</span>
        </>
      ) : null}
    </Label>
  );

  if (loadError) {
    if (operatorAllowsSyntheticAskRunPick()) {
      const selectedInSynthetic = isShowcaseDemoRunId(trimmedValue);
      const selectValue = selectedInSynthetic
        ? SHOWCASE_STATIC_DEMO_RUN_ID
        : trimmedValue.length > 0
          ? trimmedValue
          : undefined;
      const showOrphanDeepLink = trimmedValue.length > 0 && !selectedInSynthetic;

      return (
        <div className="space-y-2">
          {reviewFieldLabel}
          <Select disabled={disabled} value={selectValue} onValueChange={onChange}>
            <SelectTrigger id={selectControlId} className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}>
              <SelectValue placeholder="Choose demo review" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SHOWCASE_STATIC_DEMO_RUN_ID}>Claims Intake Modernization Review</SelectItem>
              {showOrphanDeepLink ? <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem> : null}
            </SelectContent>
          </Select>
          {!hideFieldHelper ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {syntheticLoadErrorHintText}
            </p>
          ) : null}
        </div>
      );
    }

    const showOrphanDeepLink = trimmedValue.length > 0 && !isShowcaseDemoRunId(trimmedValue);

    return (
      <div className="space-y-2">
        {reviewFieldLabel}
        <Select disabled value={trimmedValue.length > 0 ? trimmedValue : undefined}>
          <SelectTrigger id={selectControlId} className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}>
            <SelectValue placeholder={reviewsUnavailablePlaceholder} />
          </SelectTrigger>
          {showOrphanDeepLink ? (
            <SelectContent>
              <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem>
            </SelectContent>
          ) : null}
        </Select>
        {!hideFieldHelper ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{reviewsUnavailableHint}</p>
        ) : null}
      </div>
    );
  }

  if (loading) {
    const hasDeepLinkValue = trimmedValue.length > 0;

    return (
      <div className="space-y-2">
        {reviewFieldLabel}
        <Select disabled value={hasDeepLinkValue ? trimmedValue : undefined}>
          <SelectTrigger id={selectControlId} className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}>
            <SelectValue placeholder="Loading reviews…" />
          </SelectTrigger>
          {hasDeepLinkValue ? (
            <SelectContent>
              <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem>
            </SelectContent>
          ) : null}
        </Select>
      </div>
    );
  }

  if (items.length === 0) {
    const allowSyntheticPick = operatorAllowsSyntheticAskRunPick() && preferAutoPick;

    if (allowSyntheticPick) {
      const selectedInSynthetic = isShowcaseDemoRunId(trimmedValue);
      const selectValue = selectedInSynthetic
        ? SHOWCASE_STATIC_DEMO_RUN_ID
        : trimmedValue.length > 0
          ? trimmedValue
          : SHOWCASE_STATIC_DEMO_RUN_ID;
      const showOrphanDeepLink = trimmedValue.length > 0 && !selectedInSynthetic;

      return (
        <div className="space-y-2">
          {reviewFieldLabel}
          <Select disabled={disabled} value={selectValue} onValueChange={onChange}>
            <SelectTrigger id={selectControlId} className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}>
              <SelectValue placeholder="Choose demo review" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SHOWCASE_STATIC_DEMO_RUN_ID}>Claims Intake Modernization Review</SelectItem>
              {showOrphanDeepLink ? <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem> : null}
            </SelectContent>
          </Select>
          {!hideFieldHelper ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {syntheticSampleHintText}
            </p>
          ) : null}
        </div>
      );
    }

    const showOrphanDeepLink = trimmedValue.length > 0 && !isShowcaseDemoRunId(trimmedValue);

    return (
      <div className="space-y-2">
        {reviewFieldLabel}
        <Select disabled value={trimmedValue.length > 0 ? trimmedValue : undefined}>
          <SelectTrigger id={selectControlId} className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}>
            <SelectValue placeholder={emptyListPlaceholderText} />
          </SelectTrigger>
          {showOrphanDeepLink ? (
            <SelectContent>
              <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem>
            </SelectContent>
          ) : null}
        </Select>
        {!hideFieldHelper ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {emptyListHintText}{" "}
            <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/architecture/reviews/new">
              Start a review
            </Link>{" "}
            or{" "}
            <Link
              className="font-medium text-teal-800 underline dark:text-teal-300"
              href={`/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
            >
              {BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL}
            </Link>
            .
          </p>
        ) : null}
      </div>
    );
  }

  const selectedRow = findRunSummaryById(items, value);
  const selectValue = selectedRow?.runId ?? (trimmedValue.length > 0 ? trimmedValue : undefined);
  const showOrphanDeepLink = trimmedValue.length > 0 && selectedRow === undefined;

  return (
    <div className="space-y-2">
      {reviewFieldLabel}
      <Select disabled={disabled} value={selectValue} onValueChange={onChange}>
        <SelectTrigger id={selectControlId} className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}>
          <SelectValue placeholder="Choose an architecture review" />
        </SelectTrigger>
        <SelectContent>
          {items.map((row) => (
            <SelectItem key={row.runId} value={row.runId}>
              {buyerFacingReviewTitleFromSummary(row)}
            </SelectItem>
          ))}
          {showOrphanDeepLink ? <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem> : null}
        </SelectContent>
      </Select>
    </div>
  );
}
