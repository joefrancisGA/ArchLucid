import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const workspaceModeMocks = vi.hoisted(() => ({
  isWorkingMode: true,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: workspaceModeMocks.isWorkingMode }),
}));

import { WorkingUnlinkedReviewHonestyBanner } from "@/components/reviews/WorkingUnlinkedReviewHonestyBanner";

describe("WorkingUnlinkedReviewHonestyBanner (AO-49)", () => {
  it("renders for unlinked jobs in Working mode", () => {
    render(<WorkingUnlinkedReviewHonestyBanner architectureId={null} />);

    expect(screen.getByTestId("working-unlinked-review-honesty-banner")).toHaveTextContent(
      "not linked to an architecture desk",
    );
  });

  it("hides when parent architecture is known", () => {
    render(<WorkingUnlinkedReviewHonestyBanner architectureId="architecture-identity-001" />);

    expect(screen.queryByTestId("working-unlinked-review-honesty-banner")).toBeNull();
  });

  it("hides in Guided mode even when unlinked", () => {
    workspaceModeMocks.isWorkingMode = false;

    render(<WorkingUnlinkedReviewHonestyBanner architectureId={null} />);

    expect(screen.queryByTestId("working-unlinked-review-honesty-banner")).toBeNull();

    workspaceModeMocks.isWorkingMode = true;
  });
});
