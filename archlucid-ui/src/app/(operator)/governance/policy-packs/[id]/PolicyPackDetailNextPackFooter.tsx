import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PolicyPackDetailNextPackTarget } from "@/lib/resolve-next-policy-pack-in-list";
import { cn } from "@/lib/utils";

export type PolicyPackDetailNextPackFooterProps = {
  readonly target: PolicyPackDetailNextPackTarget;
};

/** Footer CTA to continue with the next policy pack in this workspace. */
export function PolicyPackDetailNextPackFooter(
  props: PolicyPackDetailNextPackFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="policy-pack-detail-next-pack-footer"
      aria-label="Next policy pack in workspace"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next pack in workspace</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.name}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="policy-pack-detail-next-pack-action">
        <Link href={props.target.href}>Open next pack</Link>
      </Button>
    </section>
  );
}
