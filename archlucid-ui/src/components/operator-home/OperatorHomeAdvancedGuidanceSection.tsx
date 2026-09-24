"use client";

import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { OperatorCorePilotDiagnosticsChecklist } from "@/components/operator/OperatorCorePilotDiagnosticsChecklist";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import {
  OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY,
  OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  operatorHomeAdvancedGuidanceDisclosureHrefFromSearch,
  parseOperatorHomeAdvancedGuidanceOpenFromSearch,
} from "@/lib/operator/operator-home-advanced-guidance-disclosure-url";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import { useOperatorHomeBooleanDisclosureUrlSync } from "@/hooks/use-operator-home-boolean-disclosure-url-sync";

type OperatorHomeAdvancedGuidanceDisclosureProps = {
  readonly checklistVariant: "full" | "compact";
  readonly showDiagnosticsChecklist: boolean;
};

function OperatorHomeAdvancedGuidanceDisclosure(
  props: OperatorHomeAdvancedGuidanceDisclosureProps,
): React.JSX.Element {
  const [advancedGuidanceExpanded, setAdvancedGuidanceExpanded] = useOperatorHomeBooleanDisclosureUrlSync(
    OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance,
    "operatorHomeAdvancedGuidanceOpen",
    parseOperatorHomeAdvancedGuidanceOpenFromSearch,
    operatorHomeAdvancedGuidanceDisclosureHrefFromSearch,
    false,
  );

  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE}
      titleId="operator-home-advanced-guidance-heading"
      sectionTestId="operator-home-advanced-guidance"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.advancedGuidance}
      defaultExpanded={false}
      expanded={advancedGuidanceExpanded}
      onExpandedChange={setAdvancedGuidanceExpanded}
      density="slim"
      collapsedSummary={OPERATOR_HOME_ADVANCED_GUIDANCE_COLLAPSED_SUMMARY}
    >
      <div className="space-y-3">
        <CorePilotChecklist variant={props.checklistVariant} />
        {props.showDiagnosticsChecklist ? <OperatorCorePilotDiagnosticsChecklist /> : null}
      </div>
    </OperatorHomeDisclosureSection>
  );
}

type OperatorHomeAdvancedGuidanceSectionProps = {
  readonly buyerPolishedShell: boolean;
  readonly fullOperatorShell?: boolean;
  readonly checklistVariant?: "full" | "compact";
};

/**
 * Collapsed-by-default walkthrough rail for the full operator shell.
 * Buyer-polished Overview uses the hero page contextual help control instead of this section.
 */
export function OperatorHomeAdvancedGuidanceSection(
  props: OperatorHomeAdvancedGuidanceSectionProps,
): React.JSX.Element | null {
  if (props.buyerPolishedShell) {
    return null;
  }

  const checklistVariant =
    props.checklistVariant ?? (props.fullOperatorShell === true ? "full" : "compact");

  return (
    <OperatorHomeAdvancedGuidanceDisclosure
      checklistVariant={checklistVariant}
      showDiagnosticsChecklist={props.fullOperatorShell === true}
    />
  );
}
