import { GetStartedEvidenceOrientationStrip } from "@/components/marketing/GetStartedEvidenceOrientationStrip";
import { GET_STARTED_ORIENTATION_SOURCES } from "@/lib/get-started-evidence-copy";

/** Buyer default: mount deduped Sources orientation below the hero (GXX). */
export function GetStartedBuyerChrome(): React.JSX.Element {
  return (
    <div data-testid="get-started-orientation-top">
      <GetStartedEvidenceOrientationStrip placement="top" sources={GET_STARTED_ORIENTATION_SOURCES} />
    </div>
  );
}
