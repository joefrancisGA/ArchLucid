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
});
