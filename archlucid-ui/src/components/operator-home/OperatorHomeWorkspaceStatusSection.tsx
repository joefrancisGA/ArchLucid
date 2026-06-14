"use client";

import { PilotRoiBaselineReadinessCard } from "@/components/operator-home/PilotRoiBaselineReadinessCard";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import {
  OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY,
  OPERATOR_HOME_WORKSPACE_STATUS_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";

/** Collapsed workspace readiness signals — ROI baseline and related prompts stay off the first-run path. */
export function OperatorHomeWorkspaceStatusSection(): React.JSX.Element {
  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_WORKSPACE_STATUS_TITLE}
      titleId="operator-home-workspace-status-heading"
      sectionTestId="operator-home-workspace-status"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.workspaceReadiness}
      defaultExpanded={false}
      density="slim"
      collapsedSummary={OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY}
    >
      <PilotRoiBaselineReadinessCard />
    </OperatorHomeDisclosureSection>
  );
}
