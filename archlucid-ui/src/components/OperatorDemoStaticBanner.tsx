import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
/**
 * Inline notice when operator run/manifest content is served from the curated showcase bundle
 * because the upstream API returned an error and static demo fallback is enabled (`NEXT_PUBLIC_DEMO_MODE` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`).
 */
export function OperatorDemoStaticBanner(): ReactElement {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const bannerText = demoMode
    ? "Cached showcase data — presenter-safe if the live API is offline."
    : "Review package aligned with the Claims Intake workspace; connect a tenant for live data.";

  return (
    <div
      className={cn("rounded-md border border-neutral-200 bg-al-surface-raised px-2.5 py-1 leading-snug text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.helper)}
      role="status"
      data-demo-static="true"
    >
      <span className="font-medium">Demonstration workspace</span>
      <span className="text-neutral-600 dark:text-neutral-400">{" — "}{bannerText}</span>
    </div>
  );
}
