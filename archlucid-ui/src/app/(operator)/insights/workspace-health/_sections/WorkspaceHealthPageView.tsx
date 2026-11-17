"use client";

import { WorkspaceHealthBreadcrumb } from "@/app/(operator)/insights/workspace-health/_sections/WorkspaceHealthBreadcrumb";
import { SponsorWorkspaceHealthDashboard } from "@/components/SponsorWorkspaceHealthDashboard";
import { WorkspaceHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  SPONSOR_WORKSPACE_HEALTH_CLAIM_DISCIPLINE,
  SPONSOR_WORKSPACE_HEALTH_PAGE_LEAD_OPERATOR,
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
  resolveSponsorWorkspaceHealthSources,
} from "@/lib/sponsor/sponsor-workspace-health-page-copy";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { SecureNowWorkspaceHealthPartialCaptureStrip } from "@/components/product-line/SecureNowWorkspaceHealthPartialCaptureStrip";
import { cn } from "@/lib/utils";
import { WORKSPACE_HEALTH_POINT_IN_TIME_HONESTY_LINE } from "@/lib/insights/workspace-health-point-in-time-honesty-copy";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

const WORKSPACE_HEALTH_PRIMARY_CONTENT_ID = "workspace-health-primary-content";
const WORKSPACE_HEALTH_SKIP_TARGET_ID = "workspace-health-first-viewport";

/** Standalone workspace health page — governance and value KPIs for the active scope. */
export function WorkspaceHealthPageView(): React.JSX.Element {
  const { productLine } = useProductLine();
  const workspaceHealthSources = resolveSponsorWorkspaceHealthSources(productLine);

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="workspace-health-page">
      <a href={`#${WORKSPACE_HEALTH_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        Skip to workspace health
      </a>

      <WorkspaceHealthBreadcrumb />

      <OperatorPageHeader
        title={SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE}
        subtitle={SPONSOR_WORKSPACE_HEALTH_PAGE_LEAD_OPERATOR}
        titleTestId="workspace-health-page-title"
        claimDiscipline={SPONSOR_WORKSPACE_HEALTH_CLAIM_DISCIPLINE}
        claimDisciplineTestId="workspace-health-header-claim-discipline"
        actions={<PageContextualHelpButton />}
      />

      <div
        id={WORKSPACE_HEALTH_PRIMARY_CONTENT_ID}
        data-testid={WORKSPACE_HEALTH_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <div id={WORKSPACE_HEALTH_SKIP_TARGET_ID} data-testid={WORKSPACE_HEALTH_SKIP_TARGET_ID} className="scroll-mt-24 space-y-4">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="workspace-health-point-in-time-honesty">
            {WORKSPACE_HEALTH_POINT_IN_TIME_HONESTY_LINE}
          </p>
          {isSecureNowProductLine(productLine) ? <SecureNowWorkspaceHealthPartialCaptureStrip /> : null}
          <SponsorWorkspaceHealthDashboard standalonePage externalPageHeader />
          <WorkspaceHealthEvidenceOrientationStrip sources={workspaceHealthSources} />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
