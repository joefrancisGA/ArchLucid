/** Page copy for `/governance/dashboard` (Executive Workspace Health / workspace overview). */

export const EXECUTIVE_WORKSPACE_HEALTH_PAGE_TITLE_BUYER = "Workspace overview";

export const EXECUTIVE_WORKSPACE_HEALTH_PAGE_TITLE_OPERATOR = "Executive Workspace Health";

export const EXECUTIVE_WORKSPACE_HEALTH_PAGE_LEAD_BUYER =
  "Governance posture at a glance for your current workspace scope — counts and trends only.";

export const EXECUTIVE_WORKSPACE_HEALTH_PAGE_LEAD_OPERATOR =
  "Pre-commit posture, severity exposure, compliance drift, approval SLAs, and a hours-first value proxy — all within your current workspace scope.";

export const EXECUTIVE_WORKSPACE_HEALTH_LAYER_GUIDANCE_TRIGGER = "About workspace health";

export const EXECUTIVE_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL = "Open governance workflow";

export const EXECUTIVE_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY = "Session scope";

export type ExecutiveWorkspaceHealthKpiKey =
  | "preCommitOutcomes"
  | "highCriticalExposure"
  | "complianceDrift"
  | "approvalSla"
  | "valueProxy";

const EXECUTIVE_WORKSPACE_HEALTH_KPI_TITLES: Record<
  ExecutiveWorkspaceHealthKpiKey,
  { buyer: string; operator: string }
> = {
  preCommitOutcomes: {
    buyer: "Pre-commit outcomes (30 days)",
    operator: "1. Pre-commit outcomes (30 days)",
  },
  highCriticalExposure: {
    buyer: "High / Critical exposure (90 days)",
    operator: "2. High / Critical finding exposure (90 days)",
  },
  complianceDrift: {
    buyer: "Compliance drift trend (30 days)",
    operator: "3. Compliance drift trend (30 days)",
  },
  approvalSla: {
    buyer: "Approval SLA posture",
    operator: "4. Approval SLA posture",
  },
  valueProxy: {
    buyer: "Pre-commit blocks as value proxy",
    operator: "5. Pre-commit blocks as value proxy",
  },
};

export function executiveWorkspaceHealthPageTitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? EXECUTIVE_WORKSPACE_HEALTH_PAGE_TITLE_BUYER
    : EXECUTIVE_WORKSPACE_HEALTH_PAGE_TITLE_OPERATOR;
}

export function executiveWorkspaceHealthPageLead(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? EXECUTIVE_WORKSPACE_HEALTH_PAGE_LEAD_BUYER
    : EXECUTIVE_WORKSPACE_HEALTH_PAGE_LEAD_OPERATOR;
}

export function executiveWorkspaceHealthKpiTitle(
  key: ExecutiveWorkspaceHealthKpiKey,
  buyerPolishedShell: boolean,
): string {
  const block = EXECUTIVE_WORKSPACE_HEALTH_KPI_TITLES[key];

  return buyerPolishedShell ? block.buyer : block.operator;
}
