import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ApprovalLineageNextRequestTarget } from "@/lib/resolve-next-approval-request";
import { cn } from "@/lib/utils";

export type GovernanceApprovalLineageNextRequestFooterProps = {
  readonly target: ApprovalLineageNextRequestTarget;
};

/** Footer CTA to open lineage for the next approval request in the queue. */
export function GovernanceApprovalLineageNextRequestFooter(
  props: GovernanceApprovalLineageNextRequestFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="approval-lineage-next-request-footer"
      aria-label="Next approval request lineage"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next approval request</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.title}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="approval-lineage-next-request-action"
      >
        <Link href={props.target.href}>Open next lineage</Link>
      </Button>
    </section>
  );
}
