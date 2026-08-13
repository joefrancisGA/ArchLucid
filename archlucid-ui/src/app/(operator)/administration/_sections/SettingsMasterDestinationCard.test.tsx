import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsMasterDestinationCard } from "./SettingsMasterDestinationCard";
import type { SettingsMasterDestination } from "./settings-master-types";

function buildDestination(overrides: Partial<SettingsMasterDestination> = {}): SettingsMasterDestination {
  return {
    id: "cloud-connections",
    title: "Cloud connections",
    description: "Automated inventory connections for evidence collection.",
    href: "/integrations/cloud-connections",
    cta: "Manage connections",
    keywords: ["cloud"],
    requiredAuthority: "ExecuteAuthority",
    tier: "common",
    scope: "workspace",
    source: "overridden",
    editability: "admin-only",
    ...overrides,
  };
}

describe("SettingsMasterDestinationCard (TB-1198 / TB-1203)", () => {
  it("does not show empty-state copy when the destination has no verified hint", () => {
    render(<SettingsMasterDestinationCard destination={buildDestination()} />);

    expect(screen.queryByText(/No cloud connection configured/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No .+ configured/i)).not.toBeInTheDocument();
  });

  it("renders a verified emptyStateHint when provided", () => {
    render(
      <SettingsMasterDestinationCard
        destination={buildDestination({
          emptyStateHint: "Verified empty: no connections in this workspace.",
        })}
      />,
    );

    expect(screen.getByText("Verified empty: no connections in this workspace.")).toBeInTheDocument();
  });

  it("keeps Scope/Source/Status meta behind disclosure by default (TB-1203)", () => {
    render(<SettingsMasterDestinationCard destination={buildDestination()} />);

    const disclosure = screen.getByTestId("settings-destination-meta-disclosure");

    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByText("Scope and editability details")).toBeInTheDocument();
    expect(screen.getByTestId("settings-scope-meta")).toBeInTheDocument();
  });
});
