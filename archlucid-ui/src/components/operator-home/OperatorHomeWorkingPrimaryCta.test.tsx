import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeWorkingPrimaryCta } from "@/components/operator-home/OperatorHomeWorkingPrimaryCta";
import { ARCHITECTURES_NEW_PATH, startReviewFromArchitectureHref } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA } from "@/lib/buyer/buyer-polish-copy";

const { useArchitectureDraftRegistryEntries, resolveContinueLastArchitectureIdentityTarget } = vi.hoisted(() => ({
  useArchitectureDraftRegistryEntries: vi.fn<() => ArchitectureDraftRegistryEntry[]>(() => []),
  resolveContinueLastArchitectureIdentityTarget: vi.fn(() => null as {
    architectureId: string;
    label: string;
    href: string;
    visitedAtUtc: string;
  } | null),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries,
}));

vi.mock("@/lib/resolve-continue-last-architecture-identity", () => ({
  resolveContinueLastArchitectureIdentityTarget,
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

describe("OperatorHomeWorkingPrimaryCta (PC-05)", () => {
  it("opens the draft editor when no architecture or draft exists", () => {
    resolveContinueLastArchitectureIdentityTarget.mockReturnValue(null);
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<OperatorHomeWorkingPrimaryCta />);

    const link = screen.getByTestId("operator-home-working-new-review-primary");

    expect(link).toHaveAttribute("href", ARCHITECTURES_NEW_PATH);
    expect(link).toHaveTextContent("Start review");
  });

  it("prefers the last-open architecture identity desk over draft resume", () => {
    resolveContinueLastArchitectureIdentityTarget.mockReturnValue({
      architectureId: "architecture-identity-001",
      label: "Payments platform",
      href: "/architecture/architectures/architecture-identity-001",
      visitedAtUtc: "2026-09-01T00:00:00.000Z",
    });
    useArchitectureDraftRegistryEntries.mockReturnValue([intakeDraftEntry()]);

    render(<OperatorHomeWorkingPrimaryCta />);

    const resume = screen.getByTestId("operator-home-working-resume-primary");

    expect(resume).toHaveAttribute("href", "/architecture/architectures/architecture-identity-001");
    expect(resume).toHaveTextContent("Open Payments platform");
    expect(screen.queryByTestId("operator-home-working-new-review-primary")).toBeNull();
  });

  it("shows draft resume when no architecture identity is cached", () => {
    resolveContinueLastArchitectureIdentityTarget.mockReturnValue(null);
    useArchitectureDraftRegistryEntries.mockReturnValue([intakeDraftEntry()]);

    render(<OperatorHomeWorkingPrimaryCta />);

    const resume = screen.getByTestId("operator-home-working-resume-primary");

    expect(resume).toHaveAttribute("href", startReviewFromArchitectureHref("arch-1"));
    expect(resume).toHaveTextContent(OPERATOR_HOME_CONTINUE_REVIEW_INTAKE_CTA);
    expect(screen.queryByTestId("operator-home-working-new-review-primary")).toBeNull();
  });
});
