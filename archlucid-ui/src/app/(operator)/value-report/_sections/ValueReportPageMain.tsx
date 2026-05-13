"use client";

import { ValueReportPageView } from "./ValueReportPageView";
import { useValueReportPage } from "./use-value-report-page";

export function ValueReportPageMain() {
  const model = useValueReportPage();

  return <ValueReportPageView model={model} />;
}
