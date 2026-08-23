import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollapsibleSection } from "./CollapsibleSection";

describe("CollapsibleSection", () => {
  it("toggles open attribute when summary clicked", () => {
    render(
      <CollapsibleSection title="More">
        <p>Inner</p>
      </CollapsibleSection>,
    );

    const details = screen.getByText("More").closest("details");

    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);

    fireEvent.click(screen.getByText("More"));

    expect(details?.open).toBe(true);
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });

  it("respects defaultOpen", () => {
    render(
      <CollapsibleSection title="Open" defaultOpen>
        <p>Visible</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText("Visible")).toBeVisible();
  });

  it("applies sectionTestId to the details root", () => {
    render(
      <CollapsibleSection title="Tagged" sectionTestId="collapsible-section-test">
        <p>Inner</p>
      </CollapsibleSection>,
    );

    const details = screen.getByTestId("collapsible-section-test");
    expect(details.tagName).toBe("DETAILS");
    expect(details).toContainElement(screen.getByText("Tagged"));
  });

  it("applies summaryId to the summary element", () => {
    render(
      <CollapsibleSection title="Labeled" summaryId="section-summary-id">
        <p>Inner</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText("Labeled").closest("summary")).toHaveAttribute("id", "section-summary-id");
  });

  it("keeps heading titles inline with the disclosure marker when headingLevel is set", () => {
    render(
      <CollapsibleSection title="Expected finding coverage" headingLevel={2} summaryLine="Coverage preview">
        <p>Inner</p>
      </CollapsibleSection>,
    );

    const summary = screen.getByText("Expected finding coverage").closest("summary");

    expect(summary).toHaveClass("flex");
    expect(screen.getByRole("heading", { level: 2, name: "Expected finding coverage" })).toHaveClass("inline");
    expect(screen.getByText("Coverage preview")).toHaveClass("basis-full");
  });
});
