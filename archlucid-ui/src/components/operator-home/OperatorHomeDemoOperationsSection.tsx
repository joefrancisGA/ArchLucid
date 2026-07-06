"use client";

import { BuyerCtoDemoReadinessPanel } from "@/components/operator-home/BuyerCtoDemoReadinessPanel";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import {
  OPERATOR_HOME_DEMO_OPERATIONS_COLLAPSED_SUMMARY,
  OPERATOR_HOME_DEMO_OPERATIONS_TITLE,
} from "@/lib/buyer-polish-copy";
import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

/** Internal demo-operator readiness controls — hidden from buyer-facing Overview by default. */
export function OperatorHomeDemoOperationsSection(): React.JSX.Element | null {
  if (!isCtoDemoOperatorToolingEnv()) {
    return null;
  }

  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_DEMO_OPERATIONS_TITLE}
      titleId="operator-home-demo-operations-heading"
      sectionTestId="operator-home-demo-operations"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.demoOperations}
      defaultExpanded={false}
      density="slim"
      collapsedSummary={OPERATOR_HOME_DEMO_OPERATIONS_COLLAPSED_SUMMARY}
    >
      <BuyerCtoDemoReadinessPanel embedded />
    </OperatorHomeDisclosureSection>
  );
}
