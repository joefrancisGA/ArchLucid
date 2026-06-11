"use client";

import { usePathname } from "next/navigation";

import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

/** One-paragraph plain-language summary of the current high-density view. */
export function ExplainThisViewBanner() {
  const pathname = usePathname() ?? "/";
  const explanation = routeViewExplanationForPathname(pathname);

  if (explanation === null) {
    return null;
  }

  return (
    <aside
      className="mb-4 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-label={`About ${explanation.title}`}
      data-testid="explain-this-view-banner"
    >
      <p className="m-0 font-semibold text-neutral-900 dark:text-neutral-50">{explanation.title}</p>
      <p className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">{explanation.summary}</p>
      <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">What to do next:</span>{" "}
        {explanation.nextAction}
      </p>
    </aside>
  );
}
