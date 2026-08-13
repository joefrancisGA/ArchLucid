"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { useOperatorNextBestActionsQuery } from "@/hooks/use-operator-next-best-actions-query";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

/**
 * Tenant-scoped next-best-action rail for operator home. Data comes from SQL-backed signals via
 * GET /v1/tenant/customer-success/next-actions.
 */
export function OperatorNextActionsCard() {
  const hideForPolishedBuyerShell = isBuyerPolishedOperatorShellEnv();

  const demoUi = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
  const { data: items, isPending, isError } = useOperatorNextBestActionsQuery({
    enabled: !hideForPolishedBuyerShell,
  });

  if (hideForPolishedBuyerShell) {
    return null;
  }

  if (isError) {
    return (
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
        Next steps unavailable (check tenant tier or sign-in).
      </p>
    );
  }

  if (isPending) {
    if (demoUi) {
      return null;
    }

    return (
      <div aria-hidden className="space-y-2">
        <div className="h-3 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  if (items === undefined || items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-next-actions-heading"
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-3"
    >
      <h3
        id="operator-next-actions-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Recommended next steps
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.actionId} className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              href={item.href}
              className={cn("font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300")}
            >
              {item.title}
            </Link>
            <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{item.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
