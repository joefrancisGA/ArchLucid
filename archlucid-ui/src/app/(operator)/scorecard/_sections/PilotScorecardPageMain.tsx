"use client";

import { PilotScorecardPageView } from "./PilotScorecardPageView";
import { usePilotScorecardPage } from "./use-pilot-scorecard-page";

export function PilotScorecardPageMain() {
  const model = usePilotScorecardPage();

  return <PilotScorecardPageView model={model} />;
}
