import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceAvailableSidebarNudge } from "@/components/sidebar-nav/GovernanceAvailableSidebarNudge";

describe("GovernanceAvailableSidebarNudge", () => {
  it("renders when first review is committed and operate nav phase is 1", () => {
    render(
      <GovernanceAvailableSidebarNudge hasCommittedArchitectureReview operateNavUnlockPhase={1} />,
    );

    expect(screen.getByTestId("governance-available-nav-nudge")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open resolve outcomes" })).toHaveAttribute("href", "/governance/approval-queue");
  });

  it("hides before first commit", () => {
    render(
      <GovernanceAvailableSidebarNudge hasCommittedArchitectureReview={false} operateNavUnlockPhase={0} />,
    );

    expect(screen.queryByTestId("governance-available-nav-nudge")).not.toBeInTheDocument();
  });

  it("hides at pilot-only operate nav phase 0 even after first commit", () => {
    render(
      <GovernanceAvailableSidebarNudge hasCommittedArchitectureReview operateNavUnlockPhase={0} />,
    );

    expect(screen.queryByTestId("governance-available-nav-nudge")).not.toBeInTheDocument();
  });

  it("hides after operate nav phase 2", () => {
    render(
      <GovernanceAvailableSidebarNudge hasCommittedArchitectureReview operateNavUnlockPhase={2} />,
    );

    expect(screen.queryByTestId("governance-available-nav-nudge")).not.toBeInTheDocument();
  });
});
