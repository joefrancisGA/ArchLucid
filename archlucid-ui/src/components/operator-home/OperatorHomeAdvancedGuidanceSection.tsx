"use client";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { OperatorCorePilotDiagnosticsChecklist } from "@/components/OperatorCorePilotDiagnosticsChecklist";
import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { StartCtoDemoCard } from "@/components/operator-home/StartCtoDemoCard";
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

/** Collapsed-by-default help rail — review walkthrough and optional demo setup. */
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
      density="slim"
      collapsedSummary={OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY}
    >
      <div className="space-y-3">
        <CorePilotChecklist variant={checklistVariant} />
        {props.buyerPolishedShell ? (
          <>
            <StartCtoDemoCard />
            <BuyerCtoDemoReadinessPanel />
          </>
        ) : null}
        {props.fullOperatorShell === true ? <OperatorCorePilotDiagnosticsChecklist /> : null}
      </div>
    </OperatorHomeDisclosureSection>
  );
}
