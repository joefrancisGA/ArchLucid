"use client";

import { useState } from "react";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { FirstPilotOperatingRail } from "@/components/FirstPilotOperatingRail";
import { FirstPilotReadinessCockpit } from "@/components/FirstPilotReadinessCockpit";
import { InProductEvidenceChecklist } from "@/components/usability/InProductEvidenceChecklist";
import { StatusVocabularyLegend } from "@/components/usability/StatusVocabularyLegend";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UnifiedFirstPilotProgressPanelProps = {
  readonly checklistVariant?: "full" | "compact";
};

type ProgressTab = "path" | "checklist" | "readiness";

/** Single home surface combining operating rail, core pilot checklist, and readiness cockpit. */
export function UnifiedFirstPilotProgressPanel(props: UnifiedFirstPilotProgressPanelProps) {
  const checklistVariant = props.checklistVariant ?? "compact";
  const [activeTab, setActiveTab] = useState<ProgressTab>("path");

  return (
    <section
      aria-labelledby="unified-first-pilot-progress-heading"
      className="space-y-4"
      data-testid="unified-first-pilot-progress-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="unified-first-pilot-progress-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-50">
          First pilot progress
        </h2>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="First pilot progress views">
          {(
            [
              { id: "path" as const, label: "Operating path" },
              { id: "checklist" as const, label: "Checklist" },
              { id: "readiness" as const, label: "Readiness" },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={activeTab === tab.id ? "default" : "outline"}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <InProductEvidenceChecklist />
      <StatusVocabularyLegend />

      <div
        role="tabpanel"
        className={cn(activeTab === "path" ? "block" : "hidden")}
        data-testid="unified-progress-tab-path"
      >
        <FirstPilotOperatingRail />
      </div>

      <div
        role="tabpanel"
        className={cn(activeTab === "checklist" ? "block" : "hidden")}
        data-testid="unified-progress-tab-checklist"
      >
        <div id="core-pilot-checklist-anchor">
          <CorePilotChecklist variant={checklistVariant} />
        </div>
      </div>

      <div
        role="tabpanel"
        className={cn(activeTab === "readiness" ? "block" : "hidden")}
        data-testid="unified-progress-tab-readiness"
      >
        <FirstPilotReadinessCockpit />
      </div>
    </section>
  );
}
