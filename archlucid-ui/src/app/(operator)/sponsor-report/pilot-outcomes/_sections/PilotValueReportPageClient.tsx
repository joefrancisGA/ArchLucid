"use client";

import type { PilotValueReportPageServerLoad } from "./load-pilot-value-report-page-data";
import { PilotValueReportPageView } from "./PilotValueReportPageView";
import { usePilotValueReportPilotPage } from "./use-pilot-value-report-pilot-page";

type Props = {
  readonly loaded: PilotValueReportPageServerLoad;
};

/** Client shell; default-window JSON is prefetched from `page.tsx`. */
export function PilotValueReportPageClient(props: Props) {
  const model = usePilotValueReportPilotPage(props.loaded);

  return <PilotValueReportPageView model={model} />;
}
