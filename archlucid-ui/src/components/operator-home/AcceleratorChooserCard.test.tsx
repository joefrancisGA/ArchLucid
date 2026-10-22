import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAcceleratorChooserPrerequisitePresentation = vi.fn();

vi.mock("@/hooks/use-accelerator-chooser-prerequisite-presentation", () => ({
  useAcceleratorChooserPrerequisitePresentation: () => useAcceleratorChooserPrerequisitePresentation(),
}));

import { AcceleratorChooserCard } from "@/components/operator-home/AcceleratorChooserCard";
import {
  ACCELERATOR_CHOOSER_HOME_CARD_TITLE,
  ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL,
} from "@/lib/accelerator-chooser-home-inbound-copy";

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

  it("uses buyer-safe home chrome and links to accelerator-chooser help (TB-1608)", () => {
    render(<AcceleratorChooserCard />);

    const card = screen.getByTestId("accelerator-chooser-card");
    const cardText = card.textContent ?? "";

    expect(screen.getByRole("heading", { level: 2, name: ACCELERATOR_CHOOSER_HOME_CARD_TITLE })).toBeInTheDocument();
    expect(cardText.toLowerCase()).not.toMatch(/\brepo\b/);
    expect(cardText.toLowerCase()).not.toContain("accelerator chooser");

    const guidanceLink = screen.getByRole("link", { name: ACCELERATOR_CHOOSER_HOME_GUIDANCE_LINK_LABEL });

    expect(guidanceLink).toHaveAttribute("href", "/help/accelerator-chooser");
  });
});
