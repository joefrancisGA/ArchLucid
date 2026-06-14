"use client";

import { FirstWeekRouteGuidance } from "@/components/FirstWeekRouteGuidance";
import { OperatorCorePilotDiagnosticsChecklist } from "@/components/OperatorCorePilotDiagnosticsChecklist";
import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { PilotStartHereStrip } from "@/components/operator-home/PilotStartHereStrip";
import { StartCtoDemoCard } from "@/components/operator-home/StartCtoDemoCard";
import { CorePilotProgressTrackerBanner } from "@/components/usability/CorePilotProgressTrackerBanner";
import { UnifiedFirstPilotProgressPanel } from "@/components/usability/UnifiedFirstPilotProgressPanel";
import {
  OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY,
  OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

type OperatorHomeAdvancedGuidanceSectionProps = {
  readonly buyerPolishedShell: boolean;
  readonly fullOperatorShell?: boolean;
  readonly checklistVariant?: "full" | "compact";
};

/** Collapsed-by-default onboarding rail — checklists, operating path, walkthroughs, optional demo setup. */
export function OperatorHomeAdvancedGuidanceSection(
  props: OperatorHomeAdvancedGuidanceSectionProps,
): React.JSX.Element {
  const checklistVariant =
    props.checklistVariant ?? (props.fullOperatorShell === true ? "full" : "compact");

  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}
      titleId="operator-home-advanced-guidance-heading"
      sectionTestId="operator-home-advanced-guidance"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
      defaultExpanded={false}
      collapsedSummary={OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY}
      sectionClassName="p-3"
    >
      <div className="space-y-3">
        <UnifiedFirstPilotProgressPanel checklistVariant={checklistVariant} embedded />
        <PilotStartHereStrip />
        <FirstWeekRouteGuidance variant="home" />
        {props.buyerPolishedShell ? (
          <>
            <StartCtoDemoCard />
            <BuyerCtoDemoReadinessPanel />
          </>
        ) : null}
        {props.fullOperatorShell === true ? <OperatorCorePilotDiagnosticsChecklist /> : null}
        <CorePilotProgressTrackerBanner compact />
      </div>
    </OperatorHomeDisclosureSection>
  );
}
