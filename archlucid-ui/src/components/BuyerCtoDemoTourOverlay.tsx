"use client";

import { BuyerCtoDemoTourShell } from "@/components/BuyerCtoDemoTourShell";
import { useBuyerCtoDemoTourController } from "@/components/use-buyer-cto-demo-tour-controller";

/**
 * Persistent presenter rail for the five-step buyer golden journey — Back/Next without hunting the layer strip.
 */
export function BuyerCtoDemoTourOverlay(): React.JSX.Element | null {
  const state = useBuyerCtoDemoTourController();

  return <BuyerCtoDemoTourShell {...state} />;
}
