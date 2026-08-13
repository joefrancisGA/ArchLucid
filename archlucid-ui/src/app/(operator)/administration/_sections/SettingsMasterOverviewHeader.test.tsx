import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration",
}));

import { SettingsMasterOverviewHeader } from "./SettingsMasterOverviewHeader";

describe("SettingsMasterOverviewHeader (TB-1199 / TB-1201)", () => {
  it("shows only real scope and environment chips — not a fake Last updated field", () => {
    render(
      <SettingsMasterOverviewHeader
        scope={{
          tenantId: "t1",
          workspaceId: "w1",
          workspaceLabel: "Pilot workspace",
          projectId: "p1",
          projectLabel: "Pilot project",
        }}
        environmentLabel="Local"
      />,
    );

    expect(screen.getByText("Scope")).toBeInTheDocument();
    expect(screen.getByText("Environment")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.queryByText("Last updated")).not.toBeInTheDocument();
    expect(screen.queryByText("See audit trail")).not.toBeInTheDocument();
  });

  it("uses PageHeading with nav icon and contextual help (TB-1201)", () => {
    render(
      <SettingsMasterOverviewHeader
        scope={{
          tenantId: "t1",
          workspaceId: "w1",
          workspaceLabel: "Pilot workspace",
          projectId: "p1",
          projectLabel: "Pilot project",
        }}
        environmentLabel="Local"
      />,
    );

    expect(screen.getByTestId("settings-master-overview-header")).toHaveAttribute(
      "data-nav-href",
      "/administration",
    );
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
  });
});
