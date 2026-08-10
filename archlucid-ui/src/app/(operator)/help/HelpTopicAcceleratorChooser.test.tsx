import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/accelerator-chooser",
}));

import { HelpAcceleratorChooserGuideView } from "@/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView";
import { ACCELERATOR_CHOOSER_ENTRIES, isAcceleratorCostGovernancePackId } from "@/lib/accelerator-chooser";
import { ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID } from "@/lib/accelerator-chooser-grid";
import {
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/accelerator-chooser-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAcceleratorChooserGuideView", () => {
  const loaded = tryLoadProductDocumentation("accelerator-chooser");

  it("loads accelerator-chooser help with buyer-facing title", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE);
  });

  it("renders specialty chooser chrome with Start CTAs and no contributor leakage (TB-1604)", () => {
    if (loaded === null) {
      throw new Error("Expected accelerator-chooser documentation to load.");
    }

    render(<HelpAcceleratorChooserGuideView entry={loaded.entry} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(visible).toContain("pick an accelerator pack");
    expect(visible).not.toContain("templates/starter-proof-packs");
    expect(visible).not.toContain("accelerator_chooser.md");
    expect(screen.getByTestId("help-accelerator-chooser-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-claim-discipline")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-accelerator-chooser-action-panel");

    expect(
      within(actionPanel).getByRole("link", { name: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.label }),
    ).toHaveAttribute("href", ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.href);

    for (const packEntry of ACCELERATOR_CHOOSER_ENTRIES) {
      if (isAcceleratorCostGovernancePackId(packEntry.id)) {
        continue;
      }

      expect(screen.getByTestId(`help-accelerator-chooser-pack-${packEntry.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`help-accelerator-chooser-start-${packEntry.id}`)).toHaveAttribute(
        "href",
        packEntry.startHref,
      );
    }

    expect(screen.getByTestId(ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-start-azure-cost-governance")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?baseline=1&accelerator=azure-cost-governance",
    );
  });
});
