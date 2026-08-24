import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PreFinalizeChecklistPanel } from "./PreFinalizeChecklistPanel";

vi.mock("@/lib/api/pre-finalize-checklist", () => ({
  getPreFinalizeChecklist: vi.fn(),
}));

import { getPreFinalizeChecklist } from "@/lib/api/pre-finalize-checklist";

describe("PreFinalizeChecklistPanel", () => {
  it("renders nothing when the manifest is already finalized", () => {
    const { container } = render(
      <PreFinalizeChecklistPanel runId="run-1" manifestFinalized />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows checklist rows when pre-finalize checks return data", async () => {
    vi.mocked(getPreFinalizeChecklist).mockResolvedValue({
      runId: "run-1",
      readyToFinalize: false,
      advisoryCount: 1,
      blockingCount: 1,
      items: [
        {
          itemId: "technology-baseline-assumed",
          title: "Technology baseline confirmed",
          detail: "1 technology row still marked Assumed.",
          status: "Blocking",
          count: 1,
        },
        {
          itemId: "evidence-linkage-gaps",
          title: "Finding evidence linkage",
          detail: "1 high-severity finding lacks evidence linkage anchors.",
          status: "Advisory",
          count: 1,
        },
      ],
    });

    render(<PreFinalizeChecklistPanel runId="run-1" manifestFinalized={false} />);

    expect(await screen.findByTestId("pre-finalize-checklist-items")).toBeInTheDocument();
    expect(screen.getByText("Review before finalize")).toBeInTheDocument();
    expect(screen.getByText("Technology baseline confirmed")).toBeInTheDocument();
    expect(screen.getByText("Finding evidence linkage")).toBeInTheDocument();
  });
});
