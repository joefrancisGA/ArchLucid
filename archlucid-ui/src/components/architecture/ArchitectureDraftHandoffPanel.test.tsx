import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureDraftHandoffPanel } from "@/components/architecture/ArchitectureDraftHandoffPanel";
import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief-state";

const useArchitectureIdentityQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQueryMock(...args),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ArchitectureDraftHandoffPanel (SD-10 / AO-07)", () => {
  beforeEach(() => {
    useArchitectureIdentityQueryMock.mockReturnValue({
      data: {
        reviews: [
          { runId: "run-41", createdUtc: "2026-08-01T00:00:00Z" },
          { runId: "run-42", createdUtc: "2026-09-01T00:00:00Z" },
        ],
        latestReviewId: "run-42",
        drafts: [],
        currentDraftId: null,
      },
    });
  });

  const fields: ArchitectureDraftFieldState = {
    businessOutcome: "Reduce settlement risk",
    freeTextIntent: "Migrate card capture to the new platform.",
    systemName: "Payments",
    structuredBrief: emptyArchitectureDraftStructuredBrief(),
  };

  it("AO-07 / SG-049: Working nested handoff primary returns to desk with job highlighted", () => {
    render(
      <ArchitectureDraftHandoffPanel
        draftId="draft-1"
        parentArchitectureId="architecture-identity-001"
        workspaceHeading="Payments modernization"
        linkedReviewId="run-42"
        linkedReviewTitle="Payments review"
        fields={fields}
      />,
    );

    expect(screen.getByTestId("architecture-draft-spawn-lock-back-honesty")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-handoff-return-desk")).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001?highlightReviewId=run-42",
    );
    expect(screen.getByTestId("architecture-draft-handoff-open-review")).toHaveAttribute(
      "href",
      `${architectureNestedFindingsPath("architecture-identity-001")}?runId=run-42`,
    );
    expect(screen.getByTestId("architecture-draft-handoff-open-review")).not.toHaveAttribute(
      "href",
      "/architecture/reviews/run-42",
    );
  });

  it("IR-014: offers committed Compare from spawn-lock handoff without draft-diff", () => {
    render(
      <ArchitectureDraftHandoffPanel
        draftId="draft-1"
        parentArchitectureId="architecture-identity-001"
        workspaceHeading="Payments modernization"
        linkedReviewId="run-42"
        linkedReviewTitle="Payments review"
        fields={fields}
      />,
    );

    const compareCta = screen.getByTestId("architecture-draft-handoff-compare-committed");

    expect(compareCta).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001/compare?leftRunId=run-41&rightRunId=run-42",
    );
    expect(compareCta.getAttribute("href")).not.toContain("draft");
  });

  it("shows read-only handoff with Open review primary — no editable fields", () => {
    render(
      <ArchitectureDraftHandoffPanel
        draftId="draft-1"
        workspaceHeading="Payments modernization"
        linkedReviewId="run-42"
        linkedReviewTitle="Payments review"
        fields={fields}
      />,
    );

    expect(screen.getByTestId("architecture-draft-handoff-panel")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-spawn-lock-snapshot-summary")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-handoff-open-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-42",
    );
    expect(screen.getByText(/Reduce settlement risk/)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-spawn-lock-clone-snapshot")).toBeInTheDocument();
  });
});
