import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  executiveWorkspaceHealthPageLead,
  executiveWorkspaceHealthPageTitle,
  EXECUTIVE_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL,
} from "@/lib/executive-workspace-health-page-copy";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

vi.mock("next/navigation", () => ({
  usePathname: () => EXECUTIVE_DASHBOARD_HREF,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

import { ExecutiveWorkspaceHealthPageHero } from "@/components/governance/ExecutiveWorkspaceHealthPageHero";

describe("ExecutiveWorkspaceHealthPageHero", () => {
  it("renders buyer hero with h1, help, and governance workflow handoff", () => {
    render(<ExecutiveWorkspaceHealthPageHero buyerPolishedShell />);

    expect(screen.getByTestId("executive-workspace-health-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: executiveWorkspaceHealthPageTitle(true) })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(true))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("executive-workspace-health-workflow-link")).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: EXECUTIVE_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL })).toBeInTheDocument();
  });

  it("renders operator title when buyer polish is off", () => {
    render(<ExecutiveWorkspaceHealthPageHero buyerPolishedShell={false} />);

    expect(screen.getByRole("heading", { level: 1, name: executiveWorkspaceHealthPageTitle(false) })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(false))).toBeInTheDocument();
  });
});
