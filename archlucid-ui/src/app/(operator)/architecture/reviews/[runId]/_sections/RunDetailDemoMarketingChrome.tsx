"use client";

import type { ReactElement } from "react";

import { OperatorDemoStaticBanner } from "@/components/OperatorDemoStaticBanner";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";

type RunDetailDemoMarketingChromeProps = {
  readonly showMarketingBanner: boolean;
  readonly showSampleBadge: boolean;
  readonly emphasizeSampleData: boolean;
};

/** Demo/sample marketing chrome — conditional paths only (TB-2142). */
export function RunDetailDemoMarketingChrome(props: RunDetailDemoMarketingChromeProps): ReactElement | null {
  if (!props.showMarketingBanner && !props.showSampleBadge) {
    return null;
  }

  return (
    <>
      {props.showMarketingBanner ? (
        <OperatorDemoStaticBanner emphasizeSampleData={props.emphasizeSampleData} />
      ) : null}
      {props.showSampleBadge ? <DemoDataBadge variant="banner" className="mb-2" /> : null}
    </>
  );
}
