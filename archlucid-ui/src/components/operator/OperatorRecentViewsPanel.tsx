"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  OPERATOR_RECENT_VIEWS_STORAGE_KEY,
  parseStoredRecentViews,
  type OperatorRecentViewsState,
} from "@/lib/operator/operator-recent-views";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Home panel: resume recently viewed reviews, findings, and operator pages. */
export function OperatorRecentViewsPanel(): React.JSX.Element | null {
  const [state, setState] = useState<OperatorRecentViewsState | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
      setState(parseStoredRecentViews(raw));
    }
    catch {
      setState(null);
    }
  }, []);

  if (state === null || state.entries.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recent-views-heading" data-testid="operator-recent-views-panel">
      <Card>
        <CardHeader className="pb-2">
          <h2 id="recent-views-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
            Recently viewed
          </h2>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {state.entries.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className={cn("font-medium text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-950 dark:text-teal-300 dark:hover:text-teal-100", OPERATOR_TYPOGRAPHY.body)}
                >
                  {entry.label}
                </Link>
                <span className={cn("ml-2 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{entry.kind}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
