import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { demoVsLiveChromeForFlags } from "@/lib/demo-vs-live-chrome";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isOperatorDemoStaticMode } from "@/lib/operator/operator-static-demo";

type OperatorDemoStaticBannerProps = {
  readonly emphasizeSampleData?: boolean;
  /** When true (and not a static-demo env), use simulator chrome (TB-2218). */
  readonly isSimulator?: boolean;
};

/**
 * Inline notice when operator run/manifest content is served from the curated showcase bundle
 * because the upstream API returned an error and static demo fallback is enabled (`NEXT_PUBLIC_DEMO_MODE` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`).
 * TB-2218: uses aggressive demo-vs-live copy so the surface cannot be mistaken for live tenant data.
 */
export function OperatorDemoStaticBanner(props: OperatorDemoStaticBannerProps): ReactElement {
  const demoMode = isNextPublicDemoMode();
  const staticEnv = isOperatorDemoStaticMode() || demoMode;
  const copy = demoVsLiveChromeForFlags({
    usedStaticDemoRun: props.isSimulator !== true || staticEnv,
    isSimulator: props.isSimulator === true && !staticEnv,
    isStaticDemoEnv: staticEnv,
  });

  const title = copy?.bannerTitle ?? "NOT LIVE DATA";
  const body =
    copy?.bannerBody ??
    (demoMode
      ? "Cached showcase data — presenter-safe if the live API is offline. Not your tenant."
      : "Review aligned with the Claims Intake workspace; connect a tenant for live data.");

  return (
    <div
      className={cn(
        "rounded-md border-2 border-amber-600 bg-amber-100 px-2.5 py-1.5 leading-snug text-amber-950 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-50",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      role="status"
      data-demo-static="true"
      data-testid="operator-demo-static-banner"
    >
      <span className="font-bold tracking-wide">{title}</span>
      <span className="text-amber-900/90 dark:text-amber-100/90">
        {" — "}
        {body}
      </span>
      {props.emphasizeSampleData === true ? (
        <span className="mt-1 block font-bold text-amber-950 dark:text-amber-100">
          Sample data — not your tenant. Not a live architecture package.
        </span>
      ) : null}
    </div>
  );
}
