"use client";

import type { ReactElement } from "react";

import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  demoVsLiveChromeForFlags,
  type DemoVsLiveChromeFlags,
} from "@/lib/demo-vs-live-chrome";

export type DemoVsLiveChromeBannerProps = DemoVsLiveChromeFlags & {
  readonly className?: string;
  readonly showWatermark?: boolean;
};

/** Unmistakable non-live banner (+ optional watermark) for static-demo / simulator chrome (TB-2218). */
export function DemoVsLiveChromeBanner(props: DemoVsLiveChromeBannerProps): ReactElement | null {
  const copy = demoVsLiveChromeForFlags({
    usedStaticDemoRun: props.usedStaticDemoRun,
    isSimulator: props.isSimulator,
    isStaticDemoEnv: props.isStaticDemoEnv,
  });

  if (copy === null) {
    return null;
  }

  return (
    <div className={cn("space-y-1", props.className)} data-testid={copy.testId}>
      <div
        className={cn(
          DESIGN_TOKENS.callout.warn,
          // 2px amber border keeps presenter-safety emphasis without a pastel fill (TB-2218).
          "border-2 border-amber-600 dark:border-amber-500",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
        data-testid="demo-vs-live-chrome-banner"
      >
        <p className="m-0 font-bold tracking-wide">{copy.bannerTitle}</p>
        <p className={cn("m-0 mt-1 leading-snug", OPERATOR_TYPOGRAPHY.helper)}>{copy.bannerBody}</p>
      </div>
      {props.showWatermark === true ? (
        <p
          className={cn(
            "m-0 select-none text-center font-bold tracking-[0.2em] text-amber-700/70 dark:text-amber-300/60",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          aria-hidden
          data-testid="demo-vs-live-chrome-watermark"
        >
          {copy.watermark}
        </p>
      ) : null}
    </div>
  );
}