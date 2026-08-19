import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorRehearsalPreviewPanel } from "@/components/reviews/SponsorRehearsalPreviewPanel";
import { SPONSOR_REHEARSAL_CAUTION } from "@/lib/sponsor-rehearsal-preview";

describe("SponsorRehearsalPreviewPanel (TB-2208)", () => {
  it("renders collapsed disclosure with sponsor-rehearsal-preview test id", () => {
    render(
      <SponsorRehearsalPreviewPanel
        input={{
          synopsisParagraph: "Working synopsis for rehearsal.",
          findings: [
            {
              title: "Missing private endpoint",
              message: "Storage lacks a private endpoint.",
              severity: "Medium",
            },
          ],
        }}
      />,
    );

    const root = screen.getByTestId("sponsor-rehearsal-preview");
    expect(root).toBeInTheDocument();
    expect(root.tagName.toLowerCase()).toBe("details");
    expect(screen.getByText("Preview as sponsor")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Preview as sponsor"));

    expect(screen.getByTestId("sponsor-rehearsal-preview-body")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-rehearsal-preview-caution")).toHaveTextContent(
      SPONSOR_REHEARSAL_CAUTION,
    );
    expect(screen.getByTestId("sponsor-rehearsal-section-sponsor-report")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-rehearsal-section-key-findings-plain-english")).toHaveTextContent(
      /Missing private endpoint/,
    );
  });

  it("renders always-visible block when collapsedByDefault is false", () => {
    render(<SponsorRehearsalPreviewPanel collapsedByDefault={false} input={{}} />);

    const root = screen.getByTestId("sponsor-rehearsal-preview");
    expect(root.tagName.toLowerCase()).toBe("section");
    expect(screen.getByTestId("sponsor-rehearsal-preview-body")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-rehearsal-section-residual-risks")).toHaveAttribute(
      "data-empty",
      "true",
    );
  });
});