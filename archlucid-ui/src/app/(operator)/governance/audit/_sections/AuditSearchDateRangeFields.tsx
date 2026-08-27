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

type AuditSearchDatePresetButtonsProps = {
  readonly searching: boolean;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => void | Promise<void>;
  readonly clearDateRangeAndSearch: () => void | Promise<void>;
};

export function AuditSearchDatePresetButtons(props: AuditSearchDatePresetButtonsProps): ReactElement {
  const {
    searching,
    loadingTypes,
    auditDatePreset,
    fromUtc,
    toUtc,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
  } = props;

  return (
    <>
      <button
        type="button"
        className={cn(
          "rounded border px-2 py-1 transition-colors",
          OPERATOR_TYPOGRAPHY.button,
          auditDatePreset === "24h"
            ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
            : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        )}
        disabled={searching || loadingTypes}
        onClick={() => {
          void applyAuditDatePreset("24h");
        }}
      >
        Last 24 hours
      </button>
      <button
        type="button"
        className={cn(
          "rounded border px-2 py-1 transition-colors",
          OPERATOR_TYPOGRAPHY.button,
          auditDatePreset === "7d"
            ? "border-neutral-400 bg-al-surface-raised text-al-text-primary dark:border-neutral-600 dark:bg-neutral-800/80"
            : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        )}
        disabled={searching || loadingTypes}
        onClick={() => {
          void applyAuditDatePreset("7d");
        }}
      >
        Last 7 days
      </button>
      {auditDatePreset !== null || fromUtc.length > 0 || toUtc.length > 0 ? (
        <button
          type="button"
          className={cn(
            "rounded border border-neutral-300 bg-neutral-50 px-2 py-1 text-al-text-primary hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-950 dark:hover:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.button,
          )}
          disabled={searching}
          onClick={() => {
            void clearDateRangeAndSearch();
          }}
        >
          Clear date range
        </button>
      ) : null}
    </>
  );
}
