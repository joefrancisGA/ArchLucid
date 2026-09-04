"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { InFlightDeskRow } from "@/lib/operations/map-in-flight-desk-rows";
import { cn } from "@/lib/utils";

export type InFlightAnalysisDeskListProps = {
  readonly rows: readonly InFlightDeskRow[];
  readonly heading: string;
  readonly headingId: string;
  readonly testId: string;
  readonly rowLinkTestIdPrefix: string;
};

/** Shared in-flight analysis desk rows — discrete step labels, no fake percent. */
export function InFlightAnalysisDeskList(props: InFlightAnalysisDeskListProps): React.JSX.Element {
  return (
    <section
      aria-labelledby={props.headingId}
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-700"
      data-testid={props.testId}
    >
      <h2
        id={props.headingId}
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {props.heading}
      </h2>

      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {props.rows.map((row) => (
          <li
            key={row.operationId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
            data-testid={`${props.rowLinkTestIdPrefix}-row-${row.operationId}`}
          >
            <div className="min-w-0 space-y-1">
              <p className={cn("m-0 truncate font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {row.title}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {row.detailLine}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <StatusTag kind="in-progress" label={row.statusLabel} />
              <Link
                href={row.href}
                className="text-al-link underline-offset-2 hover:underline"
                data-testid={`${props.rowLinkTestIdPrefix}-open-${row.operationId}`}
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
