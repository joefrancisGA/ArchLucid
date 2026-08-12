import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAcceleratorChooserPrerequisitePresentation = vi.fn();

vi.mock("@/hooks/use-accelerator-chooser-prerequisite-presentation", () => ({
  useAcceleratorChooserPrerequisitePresentation: () => useAcceleratorChooserPrerequisitePresentation(),
}));

import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";

describe("AcceleratorChooserCard", () => {
  beforeEach(() => {
    useAcceleratorChooserPrerequisitePresentation.mockReturnValue({
      status: "met",
      signedRecordHref: null,
      retry: vi.fn(),
    });
  });

  it("renders buyer-job rows with start links", () => {
    render(<AcceleratorChooserCard />);

    expect(screen.getByTestId("accelerator-chooser-card")).toBeInTheDocument();
    expect(screen.getByTestId("accelerator-chooser-row-ai-llm-workload")).toBeInTheDocument();
    expect(screen.getAllByText(/Expected outputs:/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("accelerator-chooser-start-regulated-saas-soc-procurement")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?baseline=1&accelerator=regulated-saas-soc-procurement",
    );
  });
});
