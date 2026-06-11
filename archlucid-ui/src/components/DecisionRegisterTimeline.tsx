"use client";

import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

export type DecisionRegisterTimelineProps = {
  readonly decisions: readonly ArchitectureDecisionRegisterEntry[];
};

function formatRecordedAt(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return "—";
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
}

/** Timeline layout alternative to the decision register table. */
export function DecisionRegisterTimeline(props: DecisionRegisterTimelineProps): React.JSX.Element {
  const { decisions } = props;

  if (decisions.length === 0) {
    return <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No decisions match the current filters.</p>;
  }

  return (
    <ol className="m-0 list-none space-y-3 border-l border-neutral-200 pl-4 dark:border-neutral-700" data-testid="decision-register-timeline">
      {decisions.map((row) => (
        <li key={row.decisionId ?? `${row.recordedAtUtc}-${row.title}`} className="relative">
          <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border border-teal-700 bg-white dark:border-teal-400 dark:bg-neutral-950" aria-hidden />
          <p className="m-0 text-xs text-neutral-500">{formatRecordedAt(row.recordedAtUtc)}</p>
          <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{row.title ?? "Decision"}</p>
          {row.category !== null && row.category !== undefined && row.category.trim().length > 0 ? (
            <p className="m-0 mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{row.category}</p>
          ) : null}
          {row.rationale !== null && row.rationale !== undefined && row.rationale.trim().length > 0 ? (
            <p className="m-0 mt-1 text-sm text-neutral-700 dark:text-neutral-300">{row.rationale}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
