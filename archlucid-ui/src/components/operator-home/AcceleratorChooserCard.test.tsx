import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";

describe("AcceleratorChooserCard", () => {
  it("renders buyer-job rows with start links", () => {
    render(<AcceleratorChooserCard />);

    expect(screen.getByTestId("accelerator-chooser-card")).toBeInTheDocument();
    expect(screen.getByTestId("accelerator-chooser-row-ai-llm-workload")).toBeInTheDocument();
    expect(screen.getByTestId("accelerator-chooser-start-regulated-saas-soc-procurement")).toHaveAttribute(
      "href",
      "/reviews/new?baseline=1&accelerator=regulated-saas-soc-procurement",
    );
  });
});
