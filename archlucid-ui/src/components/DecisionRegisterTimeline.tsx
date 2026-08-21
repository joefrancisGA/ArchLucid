"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

function formatRecordedDateHeading(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return "Unknown date";
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(ms));
}

function formatRecordedAt(value: string | null | undefined): string {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return " — ";
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return raw;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
}

function groupDecisionsByDate(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): ReadonlyArray<{ readonly heading: string; readonly items: readonly ArchitectureDecisionRegisterEntry[] }> {
  const groups = new Map<string, ArchitectureDecisionRegisterEntry[]>();

  for (const decision of decisions) {
    const heading = formatRecordedDateHeading(decision.recordedAtUtc);
    const existing = groups.get(heading);

    if (existing !== undefined) {
      existing.push(decision);
    } else {
      groups.set(heading, [decision]);
    }
  }

  return Array.from(groups.entries()).map(([heading, items]) => ({ heading, items }));
}

export type DecisionRegisterTimelineProps = {
  readonly decisions: readonly ArchitectureDecisionRegisterEntry[];
};

/** Timeline layout grouped by recorded date. */
export function DecisionRegisterTimeline(props: DecisionRegisterTimelineProps): React.JSX.Element {
  const groups = useMemo(() => groupDecisionsByDate(props.decisions), [props.decisions]);

  if (props.decisions.length === 0) {
    return (
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        No decisions match the current filters.
      </p>
    );
  }

  return (
    <div className="space-y-6" data-testid="decision-register-timeline">
      {groups.map((group) => (
        <section key={group.heading} aria-label={group.heading}>
          <h3 className={cn("m-0 mb-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{group.heading}</h3>
          <ol className="m-0 list-none space-y-3 border-l border-neutral-200 pl-4 dark:border-neutral-700">
            {group.items.map((row) => (
              <li key={row.decisionId ?? `${row.recordedAtUtc}-${row.title}`} className="relative">
                <span
                  className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border border-teal-700 bg-white dark:border-teal-400 dark:bg-neutral-950"
                  aria-hidden
                />
                <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{formatRecordedAt(row.recordedAtUtc)}</p>
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{row.title ?? "Decision"}</p>
                {row.category !== null && row.category !== undefined && row.category.trim().length > 0 ? (
                  <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{row.category}</p>
                ) : null}
                {row.rationale !== null && row.rationale !== undefined && row.rationale.trim().length > 0 ? (
                  <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{row.rationale}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
