import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
  OPERATOR_DATE_RANGE_LOCAL_TIME_SUFFIX,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";

export function AuditLocalDateRangeLabel(props: { readonly kind: "start" | "end" }): ReactElement {
  const label = props.kind === "start" ? OPERATOR_DATE_RANGE_START_LABEL : OPERATOR_DATE_RANGE_END_LABEL;

  return (
    <span className="block">
      {label}{" "}
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{OPERATOR_DATE_RANGE_LOCAL_TIME_SUFFIX}</span>
    </span>
  );
}

type AuditSearchDateRangeFieldsProps = {
  readonly fromUtc: string;
  readonly setFromUtc: (value: string) => void;
  readonly toUtc: string;
  readonly setToUtc: (value: string) => void;
};

export function AuditSearchDateRangeFields(props: AuditSearchDateRangeFieldsProps): ReactElement {
  const { fromUtc, setFromUtc, toUtc, setToUtc } = props;

  return (
    <>
      <label>
        <AuditLocalDateRangeLabel kind="start" />
        <input
          type="datetime-local"
          value={fromUtc}
          onChange={(e) => setFromUtc(e.target.value)}
          className={cn("mt-1", OPERATOR_DATE_RANGE_INPUT_CLASSNAME)}
        />
      </label>
      <label>
        <AuditLocalDateRangeLabel kind="end" />
        <input
          type="datetime-local"
          value={toUtc}
          onChange={(e) => setToUtc(e.target.value)}
          className={cn("mt-1", OPERATOR_DATE_RANGE_INPUT_CLASSNAME)}
        />
      </label>
    </>
  );
}

export { AuditSearchDatePresetButtons } from "./AuditSearchDatePresetButtons";
