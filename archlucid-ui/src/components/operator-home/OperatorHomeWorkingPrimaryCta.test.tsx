import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { ARCHITECTURES_NEW_PATH, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA } from "@/lib/buyer/buyer-polish-copy";

const { useArchitectureDraftRegistryEntries } = vi.hoisted(() => ({
  useArchitectureDraftRegistryEntries: vi.fn<() => ArchitectureDraftRegistryEntry[]>(() => []),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries,
}));

function intakeDraftEntry(): ArchitectureDraftRegistryEntry {
  return {
    draftId: "arch-1",
    displayName: "ArchLucid",
    customerStatus: "ready-for-review",
    ownerLabel: "You",
    lastUpdatedUtc: "2026-09-01T00:00:00.000Z",
    linkedReviewId: null,
    serverUpdatedUtc: "2026-09-01T00:00:00.000Z",
    serverDraftStatus: "ReadyForReview",
  };
}

describe("OperatorHomeWorkingPrimaryCta (LI-06)", () => {
  it("opens the draft editor when no draft exists", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<OperatorHomeWorkingPrimaryCta />);

    const link = screen.getByTestId("operator-home-working-new-review-primary");

    expect(link).toHaveAttribute("href", ARCHITECTURES_NEW_PATH);
    expect(link).toHaveTextContent("Start review");
  });

  it("shows only resume when intake is already in progress (ADR 0069)", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([intakeDraftEntry()]);

    render(<OperatorHomeWorkingPrimaryCta />);

    const resume = screen.getByTestId("operator-home-working-resume-primary");

    expect(resume).toHaveAttribute("href", startReviewFromArchitectureHref("arch-1"));
    expect(resume).toHaveTextContent(OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA);
    expect(screen.queryByTestId("operator-home-working-new-review-outline")).toBeNull();
    expect(screen.queryByTestId("operator-home-working-new-review-primary")).toBeNull();
  });
});
