import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  executiveWorkspaceHealthPageLead,
  SPONSOR_WORKSPACE_HEALTH_HEADING_ID,
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
  SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL,
} from "@/lib/sponsor-workspace-health-page-copy";

import { SponsorWorkspaceHealthPageHero } from "@/components/governance/SponsorWorkspaceHealthPageHero";

describe("SponsorWorkspaceHealthPageHero", () => {
  it("renders the section heading and approval workflow handoff", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell />);

    expect(screen.getByTestId("sponsor-workspace-health-page-hero")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(true))).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("sponsor-workspace-health-workflow-link")).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: SPONSOR_WORKSPACE_HEALTH_WORKFLOW_LINK_LABEL })).toBeInTheDocument();
  });

  it("keeps the same title when buyer polish is off and only varies the lead", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell={false} />);

    expect(screen.getByRole("heading", { level: 2, name: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(executiveWorkspaceHealthPageLead(false))).toBeInTheDocument();
  });

  it("renders an h1 on the standalone workspace health page", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell standalonePage />);

    expect(screen.getByTestId("sponsor-workspace-health-page-hero")).toHaveAttribute("data-standalone-page", "true");
    expect(screen.getByRole("heading", { level: 1, name: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE })).toBeInTheDocument();
  });

  it("renders an h2 when embedded in the sponsor dashboard", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell />);

    expect(screen.getByTestId("sponsor-workspace-health-page-hero")).toHaveAttribute("data-standalone-page", "false");
    expect(screen.getByRole("heading", { level: 2, name: SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE })).toBeInTheDocument();
  });

  /** The page heading id supports in-page anchors and assistive labels. */
  it("gives the heading the workspace health heading id", () => {
    render(<SponsorWorkspaceHealthPageHero buyerPolishedShell standalonePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("id", SPONSOR_WORKSPACE_HEALTH_HEADING_ID);
  });
});
