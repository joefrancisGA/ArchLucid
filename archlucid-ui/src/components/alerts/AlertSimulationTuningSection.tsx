"use client";

import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";

/**
 * Merged **Simulation** and **Tuning** tab for the `/alerts` hub — two existing page bodies stacked.
 */
export function AlertSimulationTuningSection() {
  return (
    <div className="space-y-14">
      <AlertSimulationContent />
      <AlertTuningContent />
    </div>
  );
}
