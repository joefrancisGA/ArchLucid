"use client";

import type { PilotScorecardPageServerLoad } from "./load-pilot-scorecard-page-data";
import { PilotScorecardPageView } from "./PilotScorecardPageView";
import { usePilotScorecardPage } from "./use-pilot-scorecard-page";

type Props = {
  readonly loaded: PilotScorecardPageServerLoad;
};

/** Client root; GET `/v1/pilots/scorecard` is prefetched from `page.tsx`. */
export function PilotScorecardPageClient(props: Props) {
  const model = usePilotScorecardPage(props.loaded);

  return <PilotScorecardPageView model={model} />;
}
