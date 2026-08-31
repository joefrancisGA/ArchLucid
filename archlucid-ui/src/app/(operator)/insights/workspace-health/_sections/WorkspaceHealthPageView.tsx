"use client";

import { SponsorWorkspaceHealthDashboard } from "@/components/SponsorWorkspaceHealthDashboard";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

/** Standalone workspace health page — governance and value KPIs for the active scope. */
export function WorkspaceHealthPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
      <SponsorWorkspaceHealthDashboard standalonePage />
    </OperatorPageContainer>
  );
}
