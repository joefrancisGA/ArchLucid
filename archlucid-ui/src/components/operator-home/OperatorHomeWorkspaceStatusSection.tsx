"use client";

import { PilotRoiBaselineReadinessCard } from "@/components/operator-home/PilotRoiBaselineReadinessCard";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { WorkspaceSetupHealthCallout } from "@/components/operator-home/WorkspaceSetupHealthCallout";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { useSetupHealthPresentation } from "@/hooks/useSetupHealthPresentation";
import {
  OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY,
  OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY_FIRST_RUN,
  OPERATOR_HOME_WORKSPACE_STATUS_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

/** Collapsed workspace readiness signals — ROI baseline and setup health when attention is needed. */
export function OperatorHomeWorkspaceStatusSection(): React.JSX.Element {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { phase, presentation } = useSetupHealthPresentation();
  const suppressSetupHealth =
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv();
  const showUnhealthySetup =
    !suppressSetupHealth && phase === "ready" && presentation !== null && !presentation.isHealthy;
  const collapsedSummary = showUnhealthySetup
    ? `${presentation.label} — open troubleshooting`
    : hasCommittedArchitectureReview
      ? OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY
      : OPERATOR_HOME_WORKSPACE_STATUS_COLLAPSED_SUMMARY_FIRST_RUN;

  return (
    <OperatorHomeDisclosureSection
      title={OPERATOR_HOME_WORKSPACE_STATUS_TITLE}
      titleId="operator-home-workspace-status-heading"
      sectionTestId="operator-home-workspace-status"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.workspaceReadiness}
      defaultExpanded={false}
      density="slim"
      collapsedSummary={collapsedSummary}
    >
      {showUnhealthySetup ? <WorkspaceSetupHealthCallout presentation={presentation} className="mb-3" /> : null}
      <PilotRoiBaselineReadinessCard />
    </OperatorHomeDisclosureSection>
  );
}
