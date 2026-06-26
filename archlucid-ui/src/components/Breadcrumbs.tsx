"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { getBreadcrumbs } from "@/lib/breadcrumb-map";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { readReviewsListReturnHref } from "@/lib/usability/reviews-list-return-state";

function subscribeReviewsListReturnHref(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => onStoreChange();

  window.addEventListener("storage", handler);

  return () => window.removeEventListener("storage", handler);
}

/**
 * Location-aware breadcrumb trail (client — uses `usePathname`). Hidden on home only.
 * Rendered above page content so the trail aligns with the main column and stays on one line.
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const queryRunId = searchParams.get("runId");
  const runIdTrimmed = queryRunId !== null && queryRunId.trim().length > 0 ? queryRunId.trim() : undefined;
  const reviewsListReturnHref = useSyncExternalStore(
    subscribeReviewsListReturnHref,
    readReviewsListReturnHref,
    () => "/reviews?projectId=default",
  );

  const items = getBreadcrumbs(pathname, {
    buyerPolishedShell: isBuyerPolishedOperatorShellEnv(),
    queryRunId: runIdTrimmed,
    reviewsListReturnHref,
  });

  if (items.length <= 1) {
    return null;
  }

  const collapseMiddle = items.length > 4;
  const visibleItems = collapseMiddle
    ? [items[0]!, { label: "…", href: undefined }, ...items.slice(-2)]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-3 min-w-0 max-w-full text-neutral-600 dark:text-neutral-400 print:hidden", OPERATOR_TYPOGRAPHY.body)}
      data-testid="operator-breadcrumbs"
    >
      <ol className="m-0 flex min-w-0 flex-nowrap items-center gap-0 overflow-hidden p-0 list-none">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className={`flex min-w-0 items-center ${isLast ? "shrink" : "shrink-0"}`}
            >
              {index > 0 ? (
                <span className="mx-1.5 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden>
                  /
                </span>
              ) : null}
              {item.label === "…" ? (
                <span className="shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden>
                  …
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="shrink-0 text-teal-800 underline decoration-teal-700/40 underline-offset-2 hover:text-teal-950 dark:text-teal-300 dark:hover:text-teal-100"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="truncate font-medium text-neutral-900 dark:text-neutral-100"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
