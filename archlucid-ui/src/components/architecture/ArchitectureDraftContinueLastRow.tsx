"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { architectureDraftPath } from "@/lib/architecture/architecture-routes";
import { formatUpdatedAbsoluteWithRelative } from "@/lib/relative-time";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

export type ArchitectureDraftContinueLastRowProps = {
  readonly entry: ArchitectureDraftRegistryEntry;
};

/** Pinned continue row for the most recently opened architecture draft. */
export function ArchitectureDraftContinueLastRow(props: ArchitectureDraftContinueLastRowProps): React.JSX.Element {
  const entry = props.entry;
  const updatedLabel = formatUpdatedAbsoluteWithRelative(entry.lastUpdatedUtc, entry.lastUpdatedUtc);

  return (
    <section
      aria-labelledby="architecture-draft-continue-last-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="architecture-draft-continue-last-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="architecture-draft-continue-last-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last draft
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{entry.displayName}</span>
            {" · "}
            Last saved {updatedLabel}
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-draft-continue-last-open">
          <Link href={architectureDraftPath(entry.architectureId)}>Open</Link>
        </Button>
      </div>
    </section>
  );
}
