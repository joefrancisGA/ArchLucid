"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useState } from "react";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { FirstPilotOperatingRail } from "@/components/FirstPilotOperatingRail";
import { FirstValueLanePanel } from "@/components/usability/FirstValueLanePanel";
import { FirstPilotReadinessCockpit } from "@/components/FirstPilotReadinessCockpit";
import { InProductEvidenceChecklist } from "@/components/usability/InProductEvidenceChecklist";
import { StatusVocabularyLegend } from "@/components/usability/StatusVocabularyLegend";
import { Button } from "@/components/ui/button";

type UnifiedFirstPilotProgressPanelProps = {
  readonly checklistVariant?: "full" | "compact";
  /** When nested under advanced guidance, omit the outer section heading. */
  readonly embedded?: boolean;
  /** Onboarding layout: checklist only — no operating path or readiness tabs. */
  readonly checklistOnly?: boolean;
};

type ProgressTab = "path" | "checklist" | "readiness";

/** Single home surface combining operating rail, core pilot checklist, and readiness cockpit. */
export function UnifiedFirstPilotProgressPanel(props: UnifiedFirstPilotProgressPanelProps) {
  const checklistVariant = props.checklistVariant ?? "compact";
  const embedded = props.embedded === true;
  const checklistOnly = props.checklistOnly === true;
  const [activeTab, setActiveTab] = useState<ProgressTab>("path");

  if (checklistOnly) {
    return (
      <section
        className="space-y-3"
        data-testid="unified-first-pilot-progress-panel"
      >
        <div id="core-pilot-checklist-anchor">
          <CorePilotChecklist variant={checklistVariant} />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={embedded ? undefined : "unified-first-pilot-progress-heading"}
      className={cn(embedded ? "space-y-3" : "space-y-4")}
      data-testid="unified-first-pilot-progress-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {embedded ? null : (
          <h2 id="unified-first-pilot-progress-heading" className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
            First review progress
          </h2>
        )}
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="First review progress views">
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

      <div
        role="tabpanel"
        className={cn(activeTab === "path" ? "block space-y-3" : "hidden")}
        data-testid="unified-progress-tab-path"
      >
        <FirstValueLanePanel />
        <FirstPilotOperatingRail />
        <InProductEvidenceChecklist />
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
        className={cn(activeTab === "readiness" ? "block space-y-3" : "hidden")}
        data-testid="unified-progress-tab-readiness"
      >
        <FirstPilotReadinessCockpit />
        <StatusVocabularyLegend />
      </div>
    </section>
  );
}
