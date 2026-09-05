import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeCompactStartingActionsSection } from "@/components/operator-home/OperatorHomeCompactStartingActionsSection";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
}));

vi.mock("@/components/operator-home/OperationalMetricsGate", () => ({
  OperationalMetricsGate: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/operator-home/AcceleratorChooserCard", () => ({
  AcceleratorChooserCard: () => <div data-testid="accelerator-chooser-card" />,
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    unfinishedWorkRailCount: 0,
  }),
}));

describe("OperatorHomeCompactStartingActionsSection (LD-06)", () => {
  it("shows a single new-review CTA in Working mode without dual-path cards", () => {
    render(<OperatorHomeCompactStartingActionsSection workingMode />);

    expect(screen.getByTestId("operator-home-working-new-review-primary")).toHaveAttribute(
      "href",
      ARCHITECTURES_NEW_PATH,
    );
    expect(screen.queryByTestId("operator-home-dual-path-cards")).toBeNull();
  });

  it("keeps dual-path cards for Guided mode when no manifest is committed", () => {
    render(<OperatorHomeCompactStartingActionsSection workingMode={false} />);

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-working-primary-cta")).toBeNull();
  });

  it("keeps a reduced-emphasis start-review CTA in Working mode when desk work exists", () => {
    render(
      <OperatorHomeCompactStartingActionsSection
        workingMode
        hasActiveDeskWork
      />,
    );

    expect(screen.getByTestId("operator-home-working-new-review-primary")).toHaveAttribute(
      "href",
      ARCHITECTURES_NEW_PATH,
    );
  });
});
