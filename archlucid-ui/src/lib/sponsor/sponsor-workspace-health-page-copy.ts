/** Page copy for `/governance/dashboard` (Sponsor Workspace Health / workspace overview). */

import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { APPROVAL_GATE_LABEL } from "@/lib/usability/canonical-product-terms";

export const SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE_BUYER = "Workspace overview";

export const SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE_OPERATOR = "Sponsor Workspace Health";

export const SPONSOR_WORKSPACE_HEALTH_PAGE_LEAD_BUYER =
  "Governance posture at a glance for your current workspace scope — counts and trends only.";

export const SPONSOR_WORKSPACE_HEALTH_PAGE_LEAD_OPERATOR =
  "Pre-commit posture, severity exposure, compliance drift, approval SLAs, and a hours-first value proxy — all within your current workspace scope.";

export const SPONSOR_WORKSPACE_HEALTH_LAYER_GUIDANCE_TRIGGER = "About workspace health";

export const SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL = "Open governance workflow";

export const SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY = "Session scope";

export const SPONSOR_WORKSPACE_HEALTH_CLAIM_DISCIPLINE =
  "These tiles are scoped workspace aggregates and planning estimates — not a sealed-review diligence Sources trail. Hours and SLA figures are derived proxies.";

export const SPONSOR_WORKSPACE_HEALTH_SOURCES_INTRO =
  "Open row-level governance surfaces before briefing sponsors from these KPI tiles.";

export type SponsorWorkspaceHealthSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/governance/dashboard`. */
export const SPONSOR_WORKSPACE_HEALTH_SOURCES: readonly SponsorWorkspaceHealthSourceLink[] = [
  { label: "Governance approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export type SponsorWorkspaceHealthKpiKey =
  | "preCommitOutcomes"
  | "highCriticalExposure"
  | "complianceDrift"
  | "approvalSla"
  | "valueProxy";

const SPONSOR_WORKSPACE_HEALTH_KPI_TITLES: Record<
  SponsorWorkspaceHealthKpiKey,
  { buyer: string; operator: string }
> = {
  preCommitOutcomes: {
    buyer: `${APPROVAL_GATE_LABEL} outcomes (30 days)`,
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
    buyer: `${APPROVAL_GATE_LABEL} blocks as value proxy`,
    operator: "5. Pre-commit blocks as value proxy",
  },
};

export function executiveWorkspaceHealthPageTitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE_BUYER
    : SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE_OPERATOR;
}

export function executiveWorkspaceHealthPageLead(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? SPONSOR_WORKSPACE_HEALTH_PAGE_LEAD_BUYER
    : SPONSOR_WORKSPACE_HEALTH_PAGE_LEAD_OPERATOR;
}

export function executiveWorkspaceHealthKpiTitle(
  key: SponsorWorkspaceHealthKpiKey,
  buyerPolishedShell: boolean,
): string {
  const block = SPONSOR_WORKSPACE_HEALTH_KPI_TITLES[key];

  return buyerPolishedShell ? block.buyer : block.operator;
}
