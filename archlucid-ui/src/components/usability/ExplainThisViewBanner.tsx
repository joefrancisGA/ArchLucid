"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

function explainViewDismissKey(pathname: string): string {
  return `archlucid.explain-view.dismissed.${pathname}`;
}

/** Dismissible side-panel summary of the current high-density view. */
export function ExplainThisViewBanner() {
  const pathname = usePathname() ?? "/";
  const explanation = routeViewExplanationForPathname(pathname);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(explainViewDismissKey(pathname)) === "1");
    }
    catch {
      setDismissed(false);
    }
  }, [pathname]);

  if (explanation === null || dismissed) {
    return null;
  }

  return (
    <aside
      className={cn("mb-4 rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.body,
        "lg:ml-auto lg:max-w-sm lg:border-l-4 lg:border-l-teal-700 lg:pl-3 dark:lg:border-l-teal-500",
      )}
      aria-label={`About ${explanation.title}`}
      data-testid="explain-this-view-banner"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-50">{explanation.title}</p>
        <button
          type="button"
          className="shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-200/80 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          aria-label={`Dismiss ${explanation.title} help`}
          onClick={() => {
            try {
              sessionStorage.setItem(explainViewDismissKey(pathname), "1");
            }
            catch {
              /* ignore */
            }

            setDismissed(true);
          }}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">{explanation.summary}</p>
      <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">What to do next:</span>{" "}
        {explanation.nextAction}
      </p>
    </aside>
  );
}
