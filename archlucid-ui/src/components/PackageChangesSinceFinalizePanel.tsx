import type { JSX } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import {
  PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_COPY,
  PACKAGE_CHANGES_SINCE_FINALIZE_INTRO,
  PACKAGE_CHANGES_SINCE_FINALIZE_TITLE,
  buildPackageChangesSinceFinalize,
  packageChangeKindLabel,
  type PackageChangeKind,
  type PackageChangeSourceEvent,
  type PackageChangeTimelineEntry,
} from "@/lib/package-changes-since-finalize";
import { cn } from "@/lib/utils";

export type PackageChangesSinceFinalizePanelProps = {
  readonly events?: readonly PackageChangeSourceEvent[] | null;
  readonly finalizeUtc?: string | null;
  /** Pre-built entries skip rebuild when the parent already mapped events. */
  readonly entries?: readonly PackageChangeTimelineEntry[] | null;
  readonly className?: string;
};

function resolveEntries(props: PackageChangesSinceFinalizePanelProps): PackageChangeTimelineEntry[] {
  if (props.entries != null) {
    return [...props.entries];
  }

  const events = props.events ?? [];

  return buildPackageChangesSinceFinalize(events, { finalizeUtc: props.finalizeUtc ?? null });
}

function statusKindForPackageChange(kind: PackageChangeKind): EnterpriseStatusKind {
  switch (kind) {
    case "disposition":
      return "needs-attention";
    case "export":
      return "ready";
    case "approval":
      return "approved";
    case "other":
      return "neutral";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * TB-2200 — post-finalize activity on a single review package (not two-review compare).
 */
export function PackageChangesSinceFinalizePanel(
  props: PackageChangesSinceFinalizePanelProps,
): JSX.Element {
  const entries = resolveEntries(props);

  return (
    <section
      id="package-changes-since-finalize"
      className={cn(
        "scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950",
        props.className,
      )}
      data-testid="package-changes-since-finalize"
      aria-labelledby="package-changes-since-finalize-heading"
    >
      <h2
        id="package-changes-since-finalize-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {PACKAGE_CHANGES_SINCE_FINALIZE_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {PACKAGE_CHANGES_SINCE_FINALIZE_INTRO}
      </p>

      {entries.length === 0 ? (
        <p
          className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="package-changes-since-finalize-empty"
        >
          {PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_COPY}
        </p>
      ) : (
        <ol
          className="m-0 mt-3 list-none space-y-3 p-0"
          data-testid="package-changes-since-finalize-list"
        >
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
              data-testid="package-changes-since-finalize-entry"
              data-change-kind={entry.kind}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag
                  kind={statusKindForPackageChange(entry.kind)}
                  label={packageChangeKindLabel(entry.kind)}
                />
                <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {entry.title}
                </span>
              </div>
              <time
                className={cn("mt-1 block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                dateTime={entry.whenUtc}
              >
                {formatInstantForLocale(entry.whenUtc)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
