import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftHandoffPanel } from "@/components/architecture/ArchitectureDraftHandoffPanel";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief-state";

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

describe("ArchitectureDraftHandoffPanel (SD-10)", () => {
  const fields: ArchitectureDraftFieldState = {
    businessOutcome: "Reduce settlement risk",
    freeTextIntent: "Migrate card capture to the new platform.",
    systemName: "Payments",
    structuredBrief: emptyArchitectureDraftStructuredBrief(),
  };

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
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-handoff-open-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-42",
    );
    expect(screen.getByText(/Reduce settlement risk/)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-clone-snapshot")).toBeInTheDocument();
  });
});
