import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsMasterOverviewHeader } from "./SettingsMasterOverviewHeader";

describe("SettingsMasterOverviewHeader (TB-1199)", () => {
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
});
