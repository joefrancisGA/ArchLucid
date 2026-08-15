import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  executiveWorkspaceHealthPageLead,
  executiveWorkspaceHealthPageTitle,
  SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL,
} from "@/lib/sponsor-workspace-health-page-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";

vi.mock("next/navigation", () => ({
  usePathname: () => SPONSOR_DASHBOARD_HREF,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

import { SponsorWorkspaceHealthPageHero } from "@/components/governance/SponsorWorkspaceHealthPageHero";

describe("SponsorWorkspaceHealthPageHero", () => {
  it("renders buyer hero with h1, help, and governance workflow handoff", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell />);

    expect(screen.getByTestId("sponsor-workspace-health-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: executiveWorkspaceHealthPageTitle(true) })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(true))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-workspace-health-workflow-link")).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL })).toBeInTheDocument();
  });

  it("renders operator title when buyer polish is off", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell={false} />);

    expect(screen.getByRole("heading", { level: 1, name: executiveWorkspaceHealthPageTitle(false) })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(false))).toBeInTheDocument();
  });
});
