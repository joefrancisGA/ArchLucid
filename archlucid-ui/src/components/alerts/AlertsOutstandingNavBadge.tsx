"use client";

import { useEffect, useState } from "react";

import { getAlertsInboxSummary } from "@/lib/api/alerts-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Count badge beside Alerts nav when open (outstanding) alerts exist. */
export function AlertsOutstandingNavBadge(): React.JSX.Element | null {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const summary = await getAlertsInboxSummary();

        if (!cancelled) {
          setCount(summary.openCount);
        }
      } catch {
        if (!cancelled) {
          setCount(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1.5 font-bold text-white",
        OPERATOR_TYPOGRAPHY.badge,
      )}
      aria-label={count === 1 ? "1 open alert" : `${count} open alerts`}
      data-testid="alerts-outstanding-nav-badge"
    >
      {count}
    </span>
  );
}
