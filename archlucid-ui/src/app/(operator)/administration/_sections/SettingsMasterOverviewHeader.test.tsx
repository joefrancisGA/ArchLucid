import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration",
}));

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SETTINGS_HUB_CLAIM_DISCIPLINE } from "@/lib/settings-hub-evidence-copy";

import { SettingsMasterOverviewHeader } from "./SettingsMasterOverviewHeader";
import { SETTINGS_MASTER_HEADER_CLAIM_DISCIPLINE_TEST_ID } from "./settings-master-page-copy";

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

  it("uses PageHeading with nav icon (TB-1201)", () => {
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
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.settings }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(SETTINGS_MASTER_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SETTINGS_HUB_CLAIM_DISCIPLINE,
    );
  });
});
