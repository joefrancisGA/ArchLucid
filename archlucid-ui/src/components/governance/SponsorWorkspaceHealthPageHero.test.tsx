import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  executiveWorkspaceHealthPageLead,
  SPONSOR_WORKSPACE_HEALTH_HEADING_ID,
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
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
  it("renders the section heading, help, and governance workflow handoff", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell />);

    expect(screen.getByTestId("sponsor-workspace-health-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(true))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-workspace-health-workflow-link")).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL })).toBeInTheDocument();
  });

  it("keeps the same title when buyer polish is off and only varies the lead", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell={false} />);

    expect(screen.getByRole("heading", { level: 2, name: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(false))).toBeInTheDocument();
  });

  /** The enclosing dashboard section points `aria-labelledby` at this id, so it must exist on the heading. */
  it("gives the heading the id the sponsor dashboard section labels itself with", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", SPONSOR_WORKSPACE_HEALTH_HEADING_ID);
  });
});
