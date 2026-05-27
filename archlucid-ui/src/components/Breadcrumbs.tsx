"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getBreadcrumbs } from "@/lib/breadcrumb-map";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/**
 * Location-aware breadcrumb trail (client — uses `usePathname`). Hidden on home only.
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const queryRunId = searchParams.get("runId");
  const runIdTrimmed = queryRunId !== null && queryRunId.trim().length > 0 ? queryRunId.trim() : undefined;

  const items = getBreadcrumbs(pathname, {
    buyerPolishedShell: isBuyerPolishedOperatorShellEnv(),
    queryRunId: runIdTrimmed,
  });

  if (items.length <= 1) {
    return null;
  }

  const collapseMiddle = items.length > 4;
  const visibleItems = collapseMiddle
    ? [items[0]!, { label: "…", href: undefined }, ...items.slice(-2)]
    : items;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
      <ol className="m-0 flex flex-wrap items-center gap-1 p-0 list-none">
        {visibleItems.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? (
              <span className="text-neutral-400 dark:text-neutral-500" aria-hidden>
                /
              </span>
            ) : null}
            {item.label === "…" ? (
              <span className="text-neutral-400 dark:text-neutral-500" aria-hidden>
                …
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-teal-800 underline decoration-teal-700/40 underline-offset-2 hover:text-teal-950 dark:text-teal-300 dark:hover:text-teal-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium text-neutral-900 dark:text-neutral-100"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
