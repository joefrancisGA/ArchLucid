import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/accelerator-chooser",
}));

const useCorePilotCommitContextQuery = vi.fn();

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => useCorePilotCommitContextQuery(),
}));

import { HelpAcceleratorChooserGuideView } from "@/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView";
import { ACCELERATOR_CHOOSER_ENTRIES, isAcceleratorCostGovernancePackId } from "@/lib/accelerator-chooser";
import { buildAcceleratorPackStartAriaLabel } from "@/lib/accelerator-chooser-pack-start-aria-label";
import { ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID } from "@/lib/accelerator-chooser-grid";
import {
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/accelerator-chooser-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const BANNED_VISIBLE_COPY = [
  /\bcore pilot\b/i,
  /\bsources package\b/i,
  /\brun and export\b/i,
  /\bstart an architecture review\b/i,
  /\bstart the review\b/i,
] as const;

describe("HelpAcceleratorChooserGuideView", () => {
  const loaded = tryLoadProductDocumentation("accelerator-chooser");

  beforeEach(() => {
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        hasCommittedManifest: false,
        committedReviewCount: 0,
        latestRunId: null,
        firstCommittedRunId: null,
        secondCommittedRunId: null,
        latestRunReadyToFinalize: false,
      },
    });
  });

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
    expect(screen.queryByTestId("help-accelerator-chooser-out-of-scope")).toBeNull();
    expect(visible).not.toContain("live stripe");
    expect(visible).not.toContain("cpa soc 2");
    expect(visible).not.toContain("v1.1 unless separately promoted");
    expect(visible).not.toContain("public reference customers");

    for (const pattern of BANNED_VISIBLE_COPY) {
      expect(visible).not.toMatch(pattern);
    }

    const actionPanel = screen.getByTestId("help-accelerator-chooser-action-panel");

    expect(screen.getByTestId("help-accelerator-chooser-prerequisite-tenant-state")).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-prerequisite-status")).toBeInTheDocument();
    expect(
      within(actionPanel).getByRole("link", {
        name: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label,
      }),
    ).toHaveAttribute("href", ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href);
    expect(
      within(actionPanel).queryByRole("link", { name: /start an architecture review/i }),
    ).toBeNull();

    const packStartLinks = screen.getAllByRole("link", { name: /start with the/i });
    const ariaLabels = packStartLinks.map((link) => link.getAttribute("aria-label")).filter(Boolean);

    expect(new Set(ariaLabels).size).toBe(ariaLabels.length);
    expect(ariaLabels).toHaveLength(5);

    for (const packEntry of ACCELERATOR_CHOOSER_ENTRIES) {
      if (isAcceleratorCostGovernancePackId(packEntry.id)) {
        continue;
      }

      expect(screen.getByTestId(`help-accelerator-chooser-pack-${packEntry.id}`)).toBeInTheDocument();
      const startLink = screen.getByTestId(`help-accelerator-chooser-start-${packEntry.id}`);

      expect(startLink).toHaveAttribute("href", packEntry.startHref);
      expect(startLink).toHaveAttribute(
        "aria-label",
        buildAcceleratorPackStartAriaLabel(packEntry.packLabel, packEntry.buyerJob),
      );
    }

    expect(screen.getByTestId(ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-start-azure-cost-governance")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?baseline=1&accelerator=azure-cost-governance",
    );
    expect(screen.getByTestId("help-accelerator-chooser-start-azure-cost-governance")).toHaveAttribute(
      "aria-label",
      buildAcceleratorPackStartAriaLabel("Cost governance pack", "Azure cost & orphan review"),
    );

    fireEvent.click(screen.getByRole("radio", { name: "AWS" }));

    expect(screen.getByTestId("help-accelerator-chooser-start-aws-cost-governance")).toHaveAttribute(
      "aria-label",
      buildAcceleratorPackStartAriaLabel("Cost governance pack", "AWS cost & orphan review"),
    );
  });
});
