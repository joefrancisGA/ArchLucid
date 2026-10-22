import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ArchitectureDraftOverviewRewritePanel,
  canOfferArchitectureOverviewRewrite,
} from "@/components/architecture/ArchitectureDraftOverviewRewritePanel";
import { rewriteArchitectureOverviewFromBrief } from "@/lib/api/architecture-overview-rewrite-api";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  GUIDED_INTAKE_OVERVIEW_REWRITE_BRIEF_UNCHANGED_HINT,
  GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON,
  GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_GROUNDING_HINT,
} from "@/lib/guided-intake-copy";

vi.mock("@/components/compare/ArchitectureManifestUnifiedDiffView", () => ({
  ArchitectureManifestUnifiedDiffView: () => <div data-testid="overview-rewrite-diff">diff</div>,
}));

vi.mock("@/components/ai-budget/AiBudgetSpendNotice", () => ({
  AiBudgetSpendNotice: () => <div data-testid="overview-rewrite-budget-notice" />,
}));

vi.mock("@/components/usability/SimulatorModeAiOperationNotice", () => ({
  SimulatorModeAiOperationNotice: () => null,
}));

vi.mock("@/lib/api/architecture-overview-rewrite-api", () => ({
  ARCHITECTURE_OVERVIEW_REWRITE_MIN_OVERVIEW_CHARS: 20,
  buildRewriteArchitectureOverviewInput: vi.fn((input: unknown) => input),
  rewriteArchitectureOverviewFromBrief: vi.fn(),
}));

const mockedRewrite = vi.mocked(rewriteArchitectureOverviewFromBrief);

const overview =
  "Tenant migration platform with private networking and EU residency goals for architecture reviews.";

describe("canOfferArchitectureOverviewRewrite", () => {
  it("requires grounding facts and minimum overview length", () => {
    const brief = {
      ...emptyArchitectureDraftStructuredBrief(),
      confirmedConstraints: ["EU data residency"],
    };

    expect(
      canOfferArchitectureOverviewRewrite({
        currentOverview: "too short",
        structuredBrief: brief,
      }),
    ).toBe(false);

    expect(
      canOfferArchitectureOverviewRewrite({
        currentOverview: overview,
        structuredBrief: emptyArchitectureDraftStructuredBrief(),
      }),
    ).toBe(false);

    expect(
      canOfferArchitectureOverviewRewrite({
        currentOverview: overview,
        structuredBrief: brief,
      }),
    ).toBe(true);

    expect(
      canOfferArchitectureOverviewRewrite({
        currentOverview: overview,
        structuredBrief: brief,
        briefUnchangedSinceAccept: true,
      }),
    ).toBe(false);
  });
});

describe("ArchitectureDraftOverviewRewritePanel", () => {
  it("renders disabled with guidance before structured brief grounding exists", () => {
    render(
      <ArchitectureDraftOverviewRewritePanel
        currentOverview={overview}
        structuredBrief={emptyArchitectureDraftStructuredBrief()}
        onOverviewAccepted={() => undefined}
      />,
    );

    expect(screen.getByTestId("architecture-draft-overview-rewrite-panel")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-overview-rewrite")).toBeDisabled();
    expect(screen.getByTestId("architecture-draft-overview-rewrite-disabled-hint")).toHaveTextContent(
      GUIDED_INTAKE_OVERVIEW_REWRITE_NEED_GROUNDING_HINT,
    );
    expect(screen.getByTestId("overview-rewrite-budget-notice")).toBeInTheDocument();
  });

  it("previews and accepts a rewritten overview without mutating until accept", async () => {
    mockedRewrite.mockResolvedValue({
      rewrittenOverview: "Grounded overview with EU data residency.",
    });
    const onOverviewAccepted = vi.fn();

    render(
      <ArchitectureDraftOverviewRewritePanel
        currentOverview={overview}
        structuredBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedConstraints: ["EU data residency"],
        }}
        onOverviewAccepted={onOverviewAccepted}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON }));

    await waitFor(() => {
      expect(screen.getByTestId("overview-rewrite-diff")).toBeInTheDocument();
    });

    expect(onOverviewAccepted).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("architecture-draft-overview-rewrite-accept"));

    expect(onOverviewAccepted).toHaveBeenCalledWith("Grounded overview with EU data residency.");
  });

  it("offers one optional re-suggest after accept", async () => {
    mockedRewrite.mockResolvedValue({
      rewrittenOverview: "Grounded overview with EU data residency.",
    });
    const onOverviewAccepted = vi.fn();
    const onRequestResuggestFromOverview = vi.fn();

    render(
      <ArchitectureDraftOverviewRewritePanel
        currentOverview={overview}
        structuredBrief={{
          ...emptyArchitectureDraftStructuredBrief(),
          confirmedConstraints: ["EU data residency"],
        }}
        onOverviewAccepted={onOverviewAccepted}
        onRequestResuggestFromOverview={onRequestResuggestFromOverview}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON }));
    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-overview-rewrite-accept")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("architecture-draft-overview-rewrite-accept"));

    fireEvent.click(screen.getByTestId("architecture-draft-overview-rewrite-resuggest"));
    expect(onRequestResuggestFromOverview).toHaveBeenCalledTimes(1);

    expect(screen.queryByTestId("architecture-draft-overview-rewrite-resuggest")).not.toBeInTheDocument();
  });

  it("disables rewrite after accept until the structured brief changes", async () => {
    mockedRewrite.mockResolvedValue({
      rewrittenOverview: "Grounded overview with EU data residency.",
    });
    const onOverviewAccepted = vi.fn();
    const brief = {
      ...emptyArchitectureDraftStructuredBrief(),
      confirmedConstraints: ["EU data residency"],
    };

    const { rerender } = render(
      <ArchitectureDraftOverviewRewritePanel
        currentOverview={overview}
        structuredBrief={brief}
        onOverviewAccepted={onOverviewAccepted}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_OVERVIEW_REWRITE_BUTTON }));
    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-overview-rewrite-accept")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("architecture-draft-overview-rewrite-accept"));

    expect(onOverviewAccepted).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("architecture-draft-overview-rewrite")).toBeDisabled();
    expect(screen.getByTestId("architecture-draft-overview-rewrite-disabled-hint")).toHaveTextContent(
      GUIDED_INTAKE_OVERVIEW_REWRITE_BRIEF_UNCHANGED_HINT,
    );

    rerender(
      <ArchitectureDraftOverviewRewritePanel
        currentOverview="Grounded overview with EU data residency."
        structuredBrief={{
          ...brief,
          confirmedConstraints: ["EU data residency "],
        }}
        onOverviewAccepted={onOverviewAccepted}
      />,
    );

    expect(screen.getByTestId("architecture-draft-overview-rewrite")).not.toBeDisabled();
  });
});
