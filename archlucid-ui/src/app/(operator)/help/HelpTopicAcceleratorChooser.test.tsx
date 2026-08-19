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

vi.mock("@/lib/help/help-topic-pdf-download", () => ({
  downloadHelpTopicPdf: vi.fn(),
}));

const useAcceleratorChooserPrerequisitePresentation = vi.fn();

vi.mock("@/hooks/use-accelerator-chooser-prerequisite-presentation", () => ({
  useAcceleratorChooserPrerequisitePresentation: () => useAcceleratorChooserPrerequisitePresentation(),
}));

import {
  HelpAcceleratorChooserGuideView,
  ACCELERATOR_CHOOSER_GUIDE_HEADINGS,
} from "@/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView";
import {
  ACCELERATOR_CHOOSER_ENTRIES,
  isAcceleratorCostGovernancePackId,
} from "@/lib/accelerator-chooser";
import { ACCELERATOR_CHOOSER_HELP_BANNED_VISIBLE_COPY_PATTERNS } from "@/lib/accelerator-chooser-help-banned-copy";
import { ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID } from "@/lib/accelerator-chooser-grid";
import {
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import {
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/accelerator-chooser-help-guide-content";
import {
  ACCELERATOR_GREENFIELD_PACK_ID,
  ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
  ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
  ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE,
} from "@/lib/accelerator-chooser-pack-prerequisite";
import { getHelpCenterTier } from "@/lib/help/help-center-catalog";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

function renderGuideWithPrerequisiteStatus(
  status: "checking" | "met" | "not-met" | "unknown",
): ReturnType<typeof render> {
  useAcceleratorChooserPrerequisitePresentation.mockReturnValue({
    status,
    signedRecordHref: status === "met" ? "/architecture/signed-records/manifest-1" : null,
    retry: vi.fn(),
  });

  const loaded = tryLoadProductDocumentation("accelerator-chooser");

  if (loaded === null) {
    throw new Error("Expected accelerator-chooser documentation to load.");
  }

  return render(<HelpAcceleratorChooserGuideView entry={loaded.entry} />);
}

describe("HelpAcceleratorChooserGuideView", () => {
  const loaded = tryLoadProductDocumentation("accelerator-chooser");

  beforeEach(() => {
    useAcceleratorChooserPrerequisitePresentation.mockReturnValue({
      status: "not-met",
      signedRecordHref: null,
      retry: vi.fn(),
    });
  });

  it("loads accelerator-chooser help with buyer-facing title and print-only export", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe(ACCELERATOR_CHOOSER_HELP_PAGE_TITLE);
    expect(loaded?.entry.pdfStatus).toBeNull();
    expect(getHelpCenterTier(loaded!.entry)).toBe("product");
  });

  it("renders specialty chooser chrome with related next steps, claim scope, and no contributor leakage (TB-1604)", () => {
    if (loaded === null) {
      throw new Error("Expected accelerator-chooser documentation to load.");
    }

    render(<HelpAcceleratorChooserGuideView entry={loaded.entry} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(visible).toContain("starter proof packs");
    expect(visible).not.toContain("templates/starter-proof-packs");
    expect(visible).not.toContain("accelerator_chooser.md");
    expect(screen.getByTestId("help-accelerator-chooser-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-claim-discipline-scope")).toHaveTextContent(
      ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE,
    );
    expect(screen.getByTestId("help-accelerator-chooser-related-next-steps")).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-related-next-steps-links")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();
    expect(screen.queryByTestId("help-accelerator-chooser-out-of-scope")).toBeNull();
    expect(visible).not.toContain("live stripe");
    expect(visible).not.toContain("cpa soc 2");
    expect(visible).not.toContain("v1.1 unless separately promoted");
    expect(visible).not.toContain("public reference customers");

    const regulatedTechnical = screen.getByTestId("help-accelerator-chooser-pack-regulated-saas-soc-procurement-technical");

    expect(regulatedTechnical).not.toHaveAttribute("open");
    expect(within(regulatedTechnical).getByText(/second-run\.json/)).not.toBeVisible();

    for (const pattern of ACCELERATOR_CHOOSER_HELP_BANNED_VISIBLE_COPY_PATTERNS) {
      expect(visible).not.toMatch(pattern);
    }

    const relatedSection = screen.getByTestId("help-accelerator-chooser-related-next-steps-links");

    for (const source of ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS) {
      expect(within(relatedSection).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(within(relatedSection).queryByRole("link", { name: "Home" })).toBeNull();

    const actionPanel = screen.getByTestId("help-accelerator-chooser-action-panel");

    expect(screen.getByTestId("help-accelerator-chooser-prerequisite-tenant-state")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("help-accelerator-chooser-prerequisite-status")).toBeInTheDocument();
    expect(
      within(actionPanel).getByRole("link", {
        name: ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.label,
      }),
    ).toHaveAttribute("href", ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.baselineReview.href);
    expect(
      within(actionPanel).queryByRole("link", { name: /start an architecture review/i }),
    ).toBeNull();

    expect(screen.getByTestId(`help-accelerator-chooser-start-${ACCELERATOR_GREENFIELD_PACK_ID}`)).toBeInTheDocument();

    for (const packEntry of ACCELERATOR_CHOOSER_ENTRIES) {
      if (isAcceleratorCostGovernancePackId(packEntry.id)) {
        continue;
      }

      expect(screen.getByTestId(`help-accelerator-chooser-pack-${packEntry.id}`)).toBeInTheDocument();

      if (packEntry.id === ACCELERATOR_GREENFIELD_PACK_ID) {
        const startLink = screen.getByTestId(`help-accelerator-chooser-start-${packEntry.id}`);

        expect(startLink).toHaveAttribute("href", packEntry.startHref);
        expect(startLink).toHaveTextContent("Start with this pack");
        continue;
      }

      expect(screen.getByTestId(`help-accelerator-chooser-pack-${packEntry.id}-blocked`)).toHaveTextContent(
        ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE,
      );
      expect(screen.queryByTestId(`help-accelerator-chooser-start-${packEntry.id}`)).toBeNull();
    }

    expect(screen.getByTestId(ACCELERATOR_COST_GOVERNANCE_HELP_PACK_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-pack-cost-governance-blocked")).toHaveTextContent(
      ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE,
    );
    expect(screen.queryByTestId("help-accelerator-chooser-start-azure-cost-governance")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "AWS" }));

    expect(screen.queryByTestId("help-accelerator-chooser-start-aws-cost-governance")).toBeNull();
  });

  it("aligns table-of-contents ids with rendered section headings", () => {
    if (loaded === null) {
      throw new Error("Expected accelerator-chooser documentation to load.");
    }

    render(<HelpAcceleratorChooserGuideView entry={loaded.entry} />);

    for (const heading of ACCELERATOR_CHOOSER_GUIDE_HEADINGS) {
      expect(document.getElementById(heading.id)).not.toBeNull();
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });

  it("shows pending copy instead of blocked when prerequisite is checking", () => {
    renderGuideWithPrerequisiteStatus("checking");

    expect(screen.getByTestId("help-accelerator-chooser-pack-ai-llm-workload-blocked")).toHaveTextContent(
      ACCELERATOR_PACK_CTA_PENDING_CHECKING_MESSAGE,
    );
    expect(screen.queryByTestId("help-accelerator-chooser-start-ai-llm-workload")).toBeNull();
    expect(screen.getByTestId(`help-accelerator-chooser-start-${ACCELERATOR_GREENFIELD_PACK_ID}`)).toBeInTheDocument();
  });

  it("shows retry and indeterminate copy when prerequisite is unknown", () => {
    renderGuideWithPrerequisiteStatus("unknown");

    expect(screen.getByTestId("help-accelerator-chooser-prerequisite-retry")).toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-pack-ai-llm-workload-blocked")).toHaveTextContent(
      ACCELERATOR_PACK_CTA_PENDING_UNKNOWN_MESSAGE,
    );
  });

  it("enables specialty pack CTAs when prerequisite is met", () => {
    renderGuideWithPrerequisiteStatus("met");

    expect(screen.getAllByRole("link", { name: /start with this pack/i })).toHaveLength(5);
    expect(screen.getByTestId("help-accelerator-chooser-start-azure-cost-governance")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?baseline=1&accelerator=azure-cost-governance",
    );
  });
});
