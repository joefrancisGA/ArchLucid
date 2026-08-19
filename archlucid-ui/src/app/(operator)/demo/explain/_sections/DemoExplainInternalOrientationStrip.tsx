import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF,
  DEMO_EXPLAIN_INTERNAL_ORIENTATION_LEAD,
  DEMO_EXPLAIN_INTERNAL_PUBLIC_PROOF_LINK_LABEL,
  DEMO_EXPLAIN_INTERNAL_TOOLING_BADGE_LABEL,
} from "@/lib/demo-explain-page-copy";
import { cn } from "@/lib/utils";

/** TB-1322: clarifies audience when full-operator shells render internal demo explain tooling. */
export function DemoExplainInternalOrientationStrip(): React.JSX.Element {
  return (
    <div
      role="status"
      data-testid="demo-explain-internal-orientation"
      className={cn(
        "rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800",
        "dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag
          kind="neutral"
          label={DEMO_EXPLAIN_INTERNAL_TOOLING_BADGE_LABEL}
          data-testid="demo-explain-internal-tooling-badge"
        />
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="demo-explain-internal-orientation-lead">
          {DEMO_EXPLAIN_INTERNAL_ORIENTATION_LEAD}{" "}
          <Link className={OPERATOR_LINK.nav} href={DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF}>
            {DEMO_EXPLAIN_INTERNAL_PUBLIC_PROOF_LINK_LABEL}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
