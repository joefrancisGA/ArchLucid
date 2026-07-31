"use client";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { OperatorCorePilotDiagnosticsChecklist } from "@/components/OperatorCorePilotDiagnosticsChecklist";
import { ExploreArchLucidBuyerContent } from "@/components/operator-home/ExploreArchLucidBuyerContent";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import {
  OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY,
  OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

type OperatorHomeAdvancedGuidanceSectionProps = {
  readonly buyerPolishedShell: boolean;
  readonly fullOperatorShell?: boolean;
  readonly checklistVariant?: "full" | "compact";
};

/** Collapsed-by-default help rail — buyer exploration or operator walkthroughs. */
export function OperatorHomeAdvancedGuidanceSection(
  props: OperatorHomeAdvancedGuidanceSectionProps,
): React.JSX.Element {
  const checklistVariant =
    props.checklistVariant ?? (props.fullOperatorShell === true ? "full" : "compact");

  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}
      titleHref={props.buyerPolishedShell ? inAppHelpHref("first-architecture-review") : undefined}
      titleId="operator-home-advanced-guidance-heading"
      sectionTestId="operator-home-advanced-guidance"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
      defaultExpanded={false}
      density="slim"
      collapsedSummary={OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY}
    >
      <div className="space-y-3">
        {props.buyerPolishedShell ? (
          <ExploreArchLucidBuyerContent />
        ) : (
          <CorePilotChecklist variant={checklistVariant} />
        )}
        {props.fullOperatorShell === true ? <OperatorCorePilotDiagnosticsChecklist /> : null}
      </div>
    </OperatorHomeDisclosureSection>
  );
}
