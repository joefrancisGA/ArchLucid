import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureDraftNextDraftTarget } from "@/lib/resolve-next-architecture-draft-in-list";
import { cn } from "@/lib/utils";

export type ArchitectureDraftNextDraftFooterProps = {
  readonly target: ArchitectureDraftNextDraftTarget;
};

/** Footer CTA to continue with the next architecture draft in this workspace. */
export function ArchitectureDraftNextDraftFooter(
  props: ArchitectureDraftNextDraftFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="architecture-draft-next-draft-footer"
      aria-label="Next draft in workspace"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next draft in workspace</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.displayName}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="architecture-draft-next-draft-action">
        <Link href={props.target.href}>Open next draft</Link>
      </Button>
    </section>
  );
}
