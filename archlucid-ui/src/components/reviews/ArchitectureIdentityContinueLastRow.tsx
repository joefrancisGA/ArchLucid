"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import type { ContinueLastArchitectureIdentityTarget } from "@/lib/resolve-continue-last-architecture-identity";
import { OPERATOR_RESUME, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIdentityContinueLastRowProps = {
  readonly target: ContinueLastArchitectureIdentityTarget;
  readonly buttonVariant?: "primary" | "outline";
};

/** Working Overview: resume the last-open architecture identity desk (CA-37). */
export function ArchitectureIdentityContinueLastRow(
  props: ArchitectureIdentityContinueLastRowProps,
): React.JSX.Element {
  const target = props.target;
  const updatedAt = formatInventoryUpdatedAtCell(target.visitedAtUtc);

  return (
    <section
      aria-labelledby="architecture-identity-continue-last-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="architecture-identity-continue-last-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="architecture-identity-continue-last-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last architecture
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{target.label}</span>
            {" · "}
            Last opened{" "}
            <time dateTime={target.visitedAtUtc} title={updatedAt.absoluteTitle}>
              {updatedAt.display}
            </time>
          </p>
        </div>
        <Button
          type="button"
          variant={props.buttonVariant ?? "primary"}
          size="sm"
          asChild
          data-testid="architecture-identity-continue-last-open"
        >
          <Link href={target.href}>Open</Link>
        </Button>
      </div>
    </section>
  );
}
