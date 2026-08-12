"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { DismissControl } from "@/components/usability/DismissControl";
import { useAiUsageRouteShellState } from "@/app/(operator)/administration/ai-usage/_sections/ai-usage-route-shell-context";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import Link from "next/link";
import { routeViewExplanationForPathname, explainViewDismissKey } from "@/lib/usability/route-view-explanations";

/** Compact per-route orientation — merged into the main column, not a competing right-side hero card. */
export function ExplainThisViewBanner() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const aiUsageShell = useAiUsageRouteShellState();
  const quietEmptyPeriod =
    pathname === AI_USAGE_SETTINGS_PATH && aiUsageShell?.isQuietEmptyPeriod === true;
  const explanation = routeViewExplanationForPathname(pathname, {
    isAiUsageQuietEmptyPeriod: quietEmptyPeriod,
    search: searchParams.toString(),
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(explainViewDismissKey(pathname)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [pathname]);

  if (explanation === null || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50/90 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      aria-label={explanation.title}
      data-testid="explain-this-view-banner"
      role="note"
    >
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title is intentionally not shown: the page H1 and active nav item already name the route. */}
        <p className="m-0 text-neutral-700 dark:text-neutral-300">
          <InlineGuidanceLabel label="Next:" testId="inline-guidance-what-to-do-next" /> {explanation.nextAction}
          {explanation.nextActionLinks?.map((link) => (
            <span key={link.href}>
              {" "}
              <Link href={link.href} className={OPERATOR_LINK.inline}>
                {link.label}
              </Link>
            </span>
          ))}
          {explanation.nextActionLinks !== undefined && explanation.nextActionLinks.length > 0 ? "." : null}
        </p>
      </div>
      <DismissControl
        iconOnly
        ariaLabel={`Dismiss ${explanation.title} help`}
        className="h-7 w-7 shrink-0 p-1 text-neutral-500 hover:bg-neutral-200/80 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        onDismiss={() => {
          try {
            sessionStorage.setItem(explainViewDismissKey(pathname), "1");
          } catch {
            /* ignore */
          }

          setDismissed(true);
        }}
      />
    </div>
  );
}
