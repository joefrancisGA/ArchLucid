import type { ReactElement } from "react";

/**
 * Inline notice when operator run/manifest content is served from the curated showcase bundle
 * because the upstream API returned an error and static demo fallback is enabled (`NEXT_PUBLIC_DEMO_MODE` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`).
 */
export function OperatorDemoStaticBanner(): ReactElement {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <div
      className={
        demoMode
          ? "rounded-md border-2 border-teal-300/70 bg-teal-50/90 p-3 text-sm font-medium text-teal-950 shadow-sm dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-50"
          : "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
      }
      role="status"
      data-demo-static="true"
    >
      <strong className="font-medium">{demoMode ? "Sample data" : "Demonstration content"}</strong>
      {" — "}
      {demoMode
        ? "Example scenario aligned with the public completed review—connect a workspace for live tenant data."
        : "You are viewing an example review package aligned with the completed showcase—connect a workspace for live data."}
    </div>
  );
}
