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
  GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE,
  GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY,
  GOVERNANCE_APPROVAL_HELP_OVERVIEW,
  GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE,
  GOVERNANCE_APPROVAL_HELP_PAGE_TITLE,
  GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS,
  GOVERNANCE_APPROVAL_HELP_STATUS_ROWS,
  GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS,
} from "@/lib/governance-approval-help-guide-content";
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

describe("HelpGovernanceApprovalGuideView", () => {
  const entry = getProductDocumentationEntry("governance-approval");

  it("registers the governance approval help guide entry", () => {
    expect(entry?.slug).toBe("governance-approval");
    expect(entry?.title).toBe(GOVERNANCE_APPROVAL_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE);
    expect(entry?.sourcePaths).toContain("docs/library/customer-facing/GOVERNANCE_APPROVAL_OPERATOR_GUIDE.md");
  });

  it("shows purpose, actions, and overview near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: GOVERNANCE_APPROVAL_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_APPROVAL_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-overview")).toHaveTextContent(GOVERNANCE_APPROVAL_HELP_OVERVIEW);

    const actionPanel = screen.getByTestId("help-governance-approval-action-panel");
    expect(
      within(actionPanel).getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.label }),
    ).toHaveAttribute("href", GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openWorkflow.href);
    expect(
      within(actionPanel).getByRole("link", { name: GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openDashboard.label }),
    ).toHaveAttribute("href", GOVERNANCE_APPROVAL_HELP_PRIMARY_ACTIONS.openDashboard.href);
  });

  it("renders workflow steps, statuses, role navigation, and on-this-page headings", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const stepper = screen.getByTestId("help-governance-approval-workflow-stepper");
    for (const step of GOVERNANCE_APPROVAL_HELP_WORKFLOW_STEPS) {
      expect(within(stepper).getByText(step)).toBeInTheDocument();
    }

    expect(screen.getByTestId("help-governance-approval-status-table")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-role-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-role-cards")).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-common-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Governance workflow" })).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_APPROVAL_HELP_DIAGRAM_SUMMARY)).toBeInTheDocument();

    const diagramHost = screen.getByTestId("help-governance-approval-state-diagram");
    const mermaid = within(diagramHost).getByTestId("mermaid-diagram");
    expect(mermaid).toHaveTextContent('state "Under review" as UnderReview');
    expect(mermaid).toHaveTextContent("Draft --> Submitted");
    expect(mermaid).toHaveTextContent("Approved --> Superseded");
    for (const status of ["Draft", "Submitted", "Under review", "Approved", "Rejected", "Superseded"]) {
      expect(GOVERNANCE_APPROVAL_HELP_DIAGRAM_SOURCE).toContain(status);
      expect(GOVERNANCE_APPROVAL_HELP_STATUS_ROWS.some((row) => row.status === status)).toBe(true);
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

  it("exposes keyboard-accessible role tabs with expected default panel", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    render(<HelpGovernanceApprovalGuideView entry={entry} />);

    const tablist = screen.getByRole("tablist", { name: "Governance approval roles" });
    expect(tablist).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Solution architect", selected: true })).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-approval-role-panel-solution-architect")).toBeVisible();
  });

  it("uses a wide content container for desktop layout", () => {
    if (entry === undefined) {
      throw new Error("Expected governance-approval documentation entry.");
    }

    const { container } = render(<HelpGovernanceApprovalGuideView entry={entry} />);

    expect(container.querySelector('[data-testid="help-governance-approval-guide"]')).toHaveClass("max-w-[72rem]");
  });
});
