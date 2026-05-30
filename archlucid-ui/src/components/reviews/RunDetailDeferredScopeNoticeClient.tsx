"use client";

import { readFirstPilotDeferredBuyerRequirements } from "@/lib/first-pilot-operating-rail-status";

import { RunDetailDeferredScopeNotice } from "./RunDetailDeferredScopeNotice";

/** Client island: reads cockpit deferred-buyer requirements from localStorage. */
export function RunDetailDeferredScopeNoticeClient(): React.JSX.Element | null {
  const requirements = readFirstPilotDeferredBuyerRequirements();

  return (
    <RunDetailDeferredScopeNotice deferredBuyerRequirementsPresent={requirements.length > 0} />
  );
}
