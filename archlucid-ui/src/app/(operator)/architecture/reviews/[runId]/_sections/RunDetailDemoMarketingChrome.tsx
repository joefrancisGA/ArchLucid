"use client";

import type { ReactElement } from "react";

import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";

type RunDetailDemoMarketingChromeProps = {
  readonly showMarketingBanner: boolean;
  readonly showSampleBadge: boolean;
  readonly emphasizeSampleData: boolean;
  /** Static showcase / demo fallback payload for this review (TB-2218). */
  readonly usedStaticDemoRun?: boolean;
  /** Simulator or real→simulator fallback (TB-2218). */
  readonly isSimulator?: boolean;
};

/** Demo/sample marketing chrome — conditional paths only (TB-2142 / TB-2218). */
export function RunDetailDemoMarketingChrome(props: RunDetailDemoMarketingChromeProps): ReactElement | null {
  const usedStatic = props.usedStaticDemoRun === true || props.emphasizeSampleData === true;
  const showAggressive =
    props.showMarketingBanner || usedStatic || props.isSimulator === true;

  if (!showAggressive && !props.showSampleBadge) {
    return null;
  }

  return (
    <div className="mb-2 space-y-2" data-testid="run-detail-demo-marketing-chrome">
      {showAggressive ? (
        <DemoVsLiveChromeBanner
          usedStaticDemoRun={usedStatic || props.showMarketingBanner}
          isSimulator={props.isSimulator === true && !usedStatic}
          showWatermark
        />
      ) : null}
      {props.showMarketingBanner ? (
        <OperatorDemoStaticBanner
          emphasizeSampleData={props.emphasizeSampleData}
          isSimulator={props.isSimulator === true && !usedStatic}
        />
      ) : null}
      {props.showSampleBadge ? <DemoDataBadge variant="banner" className="mb-2" /> : null}
    </div>
  );
}