"use client";

import type { RoiSummaryPageServerLoad } from "./load-roi-summary-page-data";
import { RoiSummaryPageView } from "./RoiSummaryPageView";
import { useRoiSummaryPage } from "./use-roi-summary-page";

type Props = {
  readonly loaded: RoiSummaryPageServerLoad;
};

export function RoiSummaryPageClient(props: Props) {
  const model = useRoiSummaryPage(props.loaded);

  return <RoiSummaryPageView model={model} />;
}
