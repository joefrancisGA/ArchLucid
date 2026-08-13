import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpGovernanceApprovalGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceApprovalGuideView";
import {
  GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE,
  GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE,
  GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY,
  GOVERNANCE_APPROVAL_HELP_OVERVIEW,
  GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE,
  GOVERNANCE_APPROVAL_HELP_PAGE_TITLE,
  GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_ROLES,
  GOVERNANCE_APPROVAL_HELP_STATUS_ROWS,
  GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS,
} from "@/lib/governance/governance-approval-help-guide-content";
import { GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-approval-help-evidence-copy";
import { governanceDomainBadgeClass } from "@/lib/status-pill-domain-classes";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_PRIMARY_COPY = [
  "/v1/",
  "POST /",
  "GET /",
  "GovernanceController",
  "controller",
  "canonical route",
  "HTTP map",
  "data loading",
  "operator api",
  "GOVERNANCE_WORKFLOW_UI",
  "ArchLucid.Api",
  "CLI:",
  "dotnet",
  "403",
  "404",
  "implementation reference",
  "source route",
] as const;

function primaryCopyText(): string {
  const primary = screen.getByTestId("help-governance-approval-primary");

  return primary.textContent?.toLowerCase() ?? "";
}

function collectPageLinkHrefs(): string[] {
  const guide = screen.getByTestId("help-governance-approval-guide");

  return Array.from(guide.querySelectorAll("a[href]")).map((anchor) => anchor.getAttribute("href") ?? "");
}

describe("HelpGovernanceApprovalGuideView", () => {
  const entry = getProductDocumentationEntry("governance-approval");

  it("registers the governance approval help guide entry", () => {
    expect(entry?.slug).toBe("governance-approval");
    expect(entry?.title).toBe(GOVERNANCE_APPROVAL_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE);
    expect(entry?.sourcePaths).toContain("docs/library/customer-facing/GOVERNANCE_APPROVAL_OPERATOR_GUIDE.md");
  });

  it("shows purpose, actions, claim discipline, and overview near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: GOVERNANCE_APPROVAL_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-overview")).toHaveTextContent(GOVERNANCE_APPROVAL_HELP_OVERVIEW);
    expect(screen.getByTestId("help-governance-approval-claim-discipline")).toHaveTextContent(
      GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE,
    );

    const actionPanel = screen.getByTestId("help-governance-approval-action-panel");
    expect(
      within(actionPanel).getByRole("heading", { level: 2, name: GOVERNANCE_APPROVAL_HELP_ACTION_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(
      within(actionPanel).getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.label }),
    ).toHaveAttribute("href", GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.href);
    expect(
      within(actionPanel).getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openDashboard.label }),
    ).toHaveAttribute("href", GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openDashboard.href);
    expect(
      within(actionPanel).getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openFindings.label }),
    ).toHaveAttribute("href", GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openFindings.href);
  });

  it("renders workflow steps, statuses, stacked role guides, and on-this-page headings", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const stepper = screen.getByTestId("help-governance-approval-workflow-stepper");
    for (const step of GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS) {
      expect(within(stepper).getByText(step)).toBeInTheDocument();
    }

    expect(screen.getByTestId("help-governance-approval-status-table")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-role-guides")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-role-cards")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-common-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Governance workflow" })).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY)).toBeInTheDocument();

    const diagramHost = screen.getByTestId("help-governance-approval-state-diagram");
    const mermaid = within(diagramHost).getByTestId("mermaid-diagram");
    expect(mermaid).toHaveTextContent("Draft --> Submitted");
    expect(mermaid).toHaveTextContent("Approved --> Promoted");
    expect(mermaid).not.toHaveTextContent("Superseded");
    for (const status of ["Draft", "Submitted", "Approved", "Rejected", "Promoted", "Activated"]) {
      expect(GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE).toContain(status);
      expect(GOVERNANCE_APPROVAL_HELP_STATUS_ROWS.some((row) => row.status === status)).toBe(true);
    }
    expect(GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE).not.toContain("Failed");
    expect(GOVERNANCE_APPROVAL_HELP_STATUS_ROWS.some((row) => row.status === "Failed")).toBe(false);
    expect(GOVERNANCE_APPROVAL_HELP_STATUS_ROWS.some((row) => row.status === "Approved with monitoring")).toBe(
      false,
    );

    for (const role of GOVERNANCE_APPROVAL_HELP_ROLES) {
      const rolePanel = screen.getByTestId(`help-governance-approval-role-panel-${role.id}`);
      expect(rolePanel).toBeVisible();
      expect(within(rolePanel).getByRole("heading", { level: 3, name: role.title })).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "Role guides" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Statuses" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Common actions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Troubleshooting" })).toBeInTheDocument();

    const desktopToc = screen.getByTestId("help-topic-toc");
    expect(within(desktopToc).getByRole("link", { name: "Technical reference" })).toHaveAttribute(
      "href",
      "#technical-reference",
    );
    expect(within(desktopToc).getByRole("link", { name: "Security or procurement reviewer" })).toHaveAttribute(
      "href",
      "#security-reviewer",
    );
  });

  it("aligns status table rows with GovernanceApprovalStatus enum", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const tableStatuses = GOVERNANCE_APPROVAL_HELP_STATUS_ROWS.map((row) => row.status);
    const approvalRequestStatuses = [
      "Draft",
      "Submitted",
      "Approved",
      "Rejected",
      "Promoted",
      "Activated",
    ];

    expect(tableStatuses).toEqual(approvalRequestStatuses);
    for (const status of tableStatuses) {
      expect(governanceDomainBadgeClass(status)).not.toBe("");
    }
  });

  it("renders StatusTag chips for each status row", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const statusTable = screen.getByTestId("help-governance-approval-status-table");
    for (const row of GOVERNANCE_APPROVAL_HELP_STATUS_ROWS) {
      expect(within(statusTable).getByText(row.status)).toBeInTheDocument();
    }
  });

  it("keeps unique hrefs across visible link affordances", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const hrefs = collectPageLinkHrefs().filter((href) => !href.startsWith("#"));
    expect(new Set(hrefs).size).toBe(hrefs.length);

    for (const action of GOVERNANCE_APPROVAL_HELP_COMMON_ACTIONS) {
      expect(screen.getByRole("link", { name: action.label })).toHaveAttribute("href", action.href);
    }
  });

  it("renders troubleshooting without stacked amber panels", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    const { container } = render(<HelpGovernanceApprovalGuideView entry={entry} />);
    const troubleshooting = screen.getByTestId("help-governance-approval-troubleshooting");

    expect(troubleshooting.querySelectorAll("details").length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[class*="border-amber-200"]').length).toBeLessThanOrEqual(1);
  });

  it("keeps technical reference collapsed by default and mounts API detail only after expand", async () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const technicalReference = screen.getByTestId("help-governance-approval-technical-reference");
    expect(technicalReference).not.toHaveAttribute("open");
    expect(screen.queryByTestId("help-governance-approval-technical-reference-body")).toBeNull();

    fireEvent.click(within(technicalReference).getByText("Technical reference"));

    const technicalBody = await screen.findByTestId("help-governance-approval-technical-reference-body");
    expect(
      within(technicalBody).getAllByText(/POST \/v1\/governance\/approval-requests/i).length,
    ).toBeGreaterThan(0);
  });

  it("avoids implementation jargon in primary customer content", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const pageText = primaryCopyText();

    for (const phrase of BANNED_PRIMARY_COPY) {
      expect(pageText, `should not contain "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
  });

  it("does not duplicate section titles for screen readers", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    const { container } = render(<HelpGovernanceApprovalGuideView entry={entry} />);
    const primary = screen.getByTestId("help-governance-approval-primary");

    expect(within(primary).queryAllByText("Overview", { selector: "p.sr-only" })).toHaveLength(0);
    expect(container.querySelectorAll("#overview-heading")).toHaveLength(0);
  });

  it("uses a wide content container for desktop layout", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    const { container } = render(<HelpGovernanceApprovalGuideView entry={entry} />);

    expect(container.querySelector('[data-testid="help-governance-approval-guide"]')).toHaveClass("max-w-[72rem]");
  });
});
