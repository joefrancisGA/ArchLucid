import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AcceleratorJobChooserList } from "@/components/accelerator/AcceleratorJobChooserList";
import { ACCELERATOR_COST_GOVERNANCE_GROUP_ID } from "@/lib/accelerator-chooser";
import { buildAcceleratorChooserGridItems } from "@/lib/accelerator-chooser-grid";

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
});
