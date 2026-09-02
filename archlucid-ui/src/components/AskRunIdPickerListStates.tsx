"use client";

import Link from "next/link";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";
import {
  BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT,
  BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { isShowcaseDemoRunId } from "@/lib/graph-page-state";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  AskRunIdPickerFieldHelper,
  AskRunIdPickerFieldStack,
} from "@/components/AskRunIdPickerFieldLabel";

export type AskRunIdPickerSyntheticSelectProps = {
  readonly value: string;
  readonly onChange: (runId: string) => void;
  readonly selectControlId: string;
  readonly disabled: boolean;
  readonly reviewFieldLabel: React.ReactNode;
  readonly hideFieldHelper: boolean;
  readonly helperText?: string;
  readonly placeholder?: string;
  readonly forceSyntheticValue?: boolean;
};

export function AskRunIdPickerSyntheticSelect({
  value,
  onChange,
  selectControlId,
  disabled,
  reviewFieldLabel,
  hideFieldHelper,
  helperText,
  placeholder = "Choose demo review",
  forceSyntheticValue = false,
}: AskRunIdPickerSyntheticSelectProps) {
  const trimmedValue = value.trim();
  const selectedInSynthetic = isShowcaseDemoRunId(trimmedValue);
  const selectValue = forceSyntheticValue
    ? SHOWCASE_STATIC_DEMO_RUN_ID
    : selectedInSynthetic
      ? SHOWCASE_STATIC_DEMO_RUN_ID
      : trimmedValue.length > 0
        ? trimmedValue
        : undefined;
  const showOrphanDeepLink = trimmedValue.length > 0 && !selectedInSynthetic;

  return (
    <AskRunIdPickerFieldStack
      reviewFieldLabel={reviewFieldLabel}
      helper={
        helperText !== undefined ? (
          <AskRunIdPickerFieldHelper hideFieldHelper={hideFieldHelper}>{helperText}</AskRunIdPickerFieldHelper>
        ) : undefined
      }
    >
      <Select disabled={disabled} value={selectValue} onValueChange={onChange}>
        <SelectTrigger id={selectControlId} className="font-mono">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SHOWCASE_STATIC_DEMO_RUN_ID}>Claims Intake Modernization Review</SelectItem>
          {showOrphanDeepLink ? <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem> : null}
        </SelectContent>
      </Select>
    </AskRunIdPickerFieldStack>
  );
}

export type AskRunIdPickerEmptyListSelectProps = {
  readonly value: string;
  readonly selectControlId: string;
  readonly reviewFieldLabel: React.ReactNode;
  readonly hideFieldHelper: boolean;
  readonly emptyListPlaceholder: string;
  readonly emptyListHint: string;
};

export function AskRunIdPickerEmptyListSelect({
  value,
  selectControlId,
  reviewFieldLabel,
  hideFieldHelper,
  emptyListPlaceholder,
  emptyListHint,
}: AskRunIdPickerEmptyListSelectProps) {
  const trimmedValue = value.trim();
  const showOrphanDeepLink = trimmedValue.length > 0 && !isShowcaseDemoRunId(trimmedValue);

  return (
    <AskRunIdPickerFieldStack
      reviewFieldLabel={reviewFieldLabel}
      helper={
        <AskRunIdPickerFieldHelper hideFieldHelper={hideFieldHelper}>
          {emptyListHint}{" "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href="/architecture/reviews/new">
            Start a review
          </Link>{" "}
          or{" "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
          >
            {BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL}
          </Link>
          .
        </AskRunIdPickerFieldHelper>
      }
    >
      <Select disabled value={trimmedValue.length > 0 ? trimmedValue : undefined}>
        <SelectTrigger id={selectControlId} className="font-mono">
          <SelectValue placeholder={emptyListPlaceholder} />
        </SelectTrigger>
        {showOrphanDeepLink ? (
          <SelectContent>
            <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem>
          </SelectContent>
        ) : null}
      </Select>
    </AskRunIdPickerFieldStack>
  );
}

export type AskRunIdPickerUnavailableSelectProps = {
  readonly value: string;
  readonly selectControlId: string;
  readonly reviewFieldLabel: React.ReactNode;
  readonly hideFieldHelper: boolean;
  readonly placeholder: string;
  readonly hint: string;
};

export function AskRunIdPickerUnavailableSelect({
  value,
  selectControlId,
  reviewFieldLabel,
  hideFieldHelper,
  placeholder,
  hint,
}: AskRunIdPickerUnavailableSelectProps) {
  const trimmedValue = value.trim();
  const showOrphanDeepLink = trimmedValue.length > 0 && !isShowcaseDemoRunId(trimmedValue);

  return (
    <AskRunIdPickerFieldStack
      reviewFieldLabel={reviewFieldLabel}
      helper={<AskRunIdPickerFieldHelper hideFieldHelper={hideFieldHelper}>{hint}</AskRunIdPickerFieldHelper>}
    >
      <Select disabled value={trimmedValue.length > 0 ? trimmedValue : undefined}>
        <SelectTrigger id={selectControlId} className="font-mono">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {showOrphanDeepLink ? (
          <SelectContent>
            <SelectItem value={trimmedValue}>{trimmedValue}</SelectItem>
          </SelectContent>
        ) : null}
      </Select>
    </AskRunIdPickerFieldStack>
  );
}

export { BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT };
