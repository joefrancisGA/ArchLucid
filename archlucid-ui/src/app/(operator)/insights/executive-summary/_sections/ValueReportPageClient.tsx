"use client";

import type { ValueReportPageServerLoad } from "./load-value-report-page-data";
import { ValueReportPageView } from "./ValueReportPageView";
import { useValueReportPage } from "./use-value-report-page";

type Props = {
  readonly loaded: ValueReportPageServerLoad;
};

export function ValueReportPageClient(props: Props) {
  const model = useValueReportPage(props.loaded);

  return <ValueReportPageView model={model} />;
}
