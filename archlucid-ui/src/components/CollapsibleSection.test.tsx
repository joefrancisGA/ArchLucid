import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("ignores the toggle event for an open state already supplied by the parent", () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSection title="More" open onToggle={onToggle} sectionTestId="controlled-section">
        <p>Inner</p>
      </CollapsibleSection>,
    );

    const details = screen.getByTestId("controlled-section") as HTMLDetailsElement;
    fireEvent(details, new Event("toggle"));
    expect(onToggle).not.toHaveBeenCalled();

    details.open = false;
    fireEvent(details, new Event("toggle"));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(false);
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
    expect(summary).toHaveTextContent("▸");
    expect(screen.getByRole("heading", { level: 2, name: "Expected finding coverage" })).toHaveClass("inline");
    expect(screen.getByText("Coverage preview")).toHaveClass("basis-full");
  });

  it("renders a disclosure triangle on the summary row", () => {
    render(
      <CollapsibleSection title="Advanced Options">
        <p>Inner</p>
      </CollapsibleSection>,
    );

    const summary = screen.getByText("Advanced Options").closest("summary");

    expect(summary).not.toBeNull();
    expect(summary).toHaveTextContent("▸");
  });
});
