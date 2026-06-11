"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  dismissFirstVisitHelp,
  firstVisitHelpSlugForPathname,
  isFirstVisitHelpDismissed,
} from "@/lib/usability/first-visit-help";

/** Auto-surfaces contextual help on first visit to a route; remembers dismissal per path. */
export function FirstVisitHelpAutoOpen() {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const slug = firstVisitHelpSlugForPathname(pathname);

  useEffect(() => {
    if (slug === null || isFirstVisitHelpDismissed(pathname)) {
      setVisible(false);

      return;
    }

    setVisible(true);
  }, [pathname, slug]);

  if (!visible || slug === null) {
    return null;
  }

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm dark:border-teal-900 dark:bg-teal-950/40"
      role="note"
      data-testid="first-visit-help-auto-open"
    >
      <p className="m-0 text-teal-950 dark:text-teal-100">
        New here? Open contextual help for this page — it walks through what you are looking at and what to do first.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild type="button" size="sm">
          <Link href={`/help/${slug}`}>Open help</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            dismissFirstVisitHelp(pathname);
            setVisible(false);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
