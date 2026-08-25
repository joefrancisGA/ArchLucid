import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAcceleratorChooserPrerequisitePresentation = vi.fn();

vi.mock("@/hooks/use-accelerator-chooser-prerequisite-presentation", () => ({
  useAcceleratorChooserPrerequisitePresentation: () => useAcceleratorChooserPrerequisitePresentation(),
}));

import { AcceleratorJobChooserList } from "@/components/accelerator/AcceleratorJobChooserList";
import { ACCELERATOR_COST_GOVERNANCE_GROUP_ID } from "@/lib/accelerator-chooser";
import { buildAcceleratorChooserGridItems } from "@/lib/accelerator-chooser-grid";
import { ACCELERATOR_GREENFIELD_PACK_ID, ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE } from "@/lib/accelerator-chooser-pack-prerequisite";

describe("accelerator-chooser-grid", () => {
  it("collapses Azure, AWS, and GCP cost packs into one grouped grid row", () => {
    const items = buildAcceleratorChooserGridItems();
    const costRows = items.filter((item) => item.kind === "cost-governance-group");

    expect(items).toHaveLength(5);
    expect(costRows).toHaveLength(1);
    expect(items.some((item) => item.kind === "pack" && item.entry.id === "azure-cost-governance")).toBe(false);
  });
});

describe("AcceleratorJobChooserList", () => {
  beforeEach(() => {
    useAcceleratorChooserPrerequisitePresentation.mockReturnValue({
      status: "met",
      signedRecordHref: null,
      retry: vi.fn(),
    });
  });

  it("hides expected outputs in compact mode on the start-review page", () => {
    render(
      <AcceleratorJobChooserList
        compact
        listTestId="reviews-new-job-chooser-list"
        rowTestIdPrefix="reviews-new-job-chooser-row"
        startTestIdPrefix="reviews-new-job-chooser-start"
      />,
    );

    expect(screen.queryByText(/Expected outputs:/i)).toBeNull();
    expect(screen.getByTestId(`reviews-new-job-chooser-row-${ACCELERATOR_COST_GOVERNANCE_GROUP_ID}`)).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-job-chooser-row-azure-cost-governance")).toBeNull();
  });

  it("keeps expected outputs on the operator-home chooser", () => {
    render(<AcceleratorJobChooserList />);

    expect(screen.getAllByText(/Expected outputs:/i).length).toBeGreaterThan(0);
  });

  it("updates the grouped cost pack start link when the cloud picker changes", () => {
    render(
      <AcceleratorJobChooserList
        compact
        startTestIdPrefix="reviews-new-job-chooser-start"
      />,
    );

    const startLink = screen.getByTestId("reviews-new-job-chooser-start-azure-cost-governance");
    expect(startLink).toHaveAttribute("href", "/architecture/reviews/new?baseline=1&accelerator=azure-cost-governance");

    fireEvent.click(screen.getByTestId("accelerator-cost-governance-cloud-aws-cost-governance"));

    expect(screen.getByTestId("reviews-new-job-chooser-start-aws-cost-governance")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?baseline=1&accelerator=aws-cost-governance",
    );
  });

  it("blocks specialty pack starts when prerequisite is not met", () => {
    useAcceleratorChooserPrerequisitePresentation.mockReturnValue({
      status: "not-met",
      signedRecordHref: null,
      retry: vi.fn(),
    });

    render(<AcceleratorJobChooserList startTestIdPrefix="accelerator-chooser-start" />);

    expect(screen.getByTestId(`accelerator-chooser-start-${ACCELERATOR_GREENFIELD_PACK_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`accelerator-chooser-row-ai-llm-workload-blocked`)).toHaveTextContent(
      ACCELERATOR_PACK_UNLOCK_BLOCKED_MESSAGE,
    );
    expect(screen.getByTestId("accelerator-chooser-row-ai-llm-workload-follow-up-tag")).toHaveTextContent(
      "Follow-up pack",
    );
    expect(screen.queryByRole("button", { name: /start/i })).toBeNull();
    expect(screen.getAllByRole("link", { name: /start with this pack/i })).toHaveLength(1);
  });
});
