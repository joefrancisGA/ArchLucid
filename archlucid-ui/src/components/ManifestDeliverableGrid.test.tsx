import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ManifestDeliverableGrid } from "@/components/ManifestDeliverableGrid";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: vi.fn(() => true),
}));

describe("ManifestDeliverableGrid", () => {
  it("renders deliverable tiles when buyer polished", () => {
    render(
      <ManifestDeliverableGrid
        manifestId="manifest-1"
        runId="customer-intake-modernization"
        buyerPolished
        systemName="Enterprise Customer Intake Modernization Review"
      />,
    );

    expect(screen.getByTestId("manifest-deliverable-grid")).toBeInTheDocument();
    expect(screen.getByTestId("deliverable-tile-executive-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("deliverable-tile-docx")).toBeInTheDocument();
    expect(screen.getByTestId("deliverable-tile-zip")).toBeInTheDocument();
    expect(screen.getByTestId("deliverable-tile-markdown")).toBeInTheDocument();
  });

  it("returns null when buyer polished is false", () => {
    const { container } = render(
      <ManifestDeliverableGrid manifestId="manifest-1" runId="run-1" buyerPolished={false} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("hides PDF tile when demo pack env is inactive", async () => {
    const { isCtoDemoPackEnv } = await import("@/lib/cto-demo-presenter-pack");

    vi.mocked(isCtoDemoPackEnv).mockReturnValue(false);

    render(
      <ManifestDeliverableGrid manifestId="manifest-1" runId="customer-intake-modernization" buyerPolished />,
    );

    expect(screen.queryByTestId("deliverable-tile-executive-pdf")).toBeNull();
    expect(screen.getByTestId("deliverable-tile-docx")).toBeInTheDocument();
  });
});
