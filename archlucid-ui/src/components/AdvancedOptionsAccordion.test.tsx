import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvancedOptionsAccordion } from "./AdvancedOptionsAccordion";

describe("AdvancedOptionsAccordion", () => {
  it("rotates the disclosure triangle downward when expanded", () => {
    render(
      <AdvancedOptionsAccordion triggerLabel="Technical details">
        <p>Diagnostics panel</p>
      </AdvancedOptionsAccordion>,
    );

    const trigger = screen.getByRole("button", { name: "Technical details" });
    const triangle = screen.getByText("▸");

    expect(triangle).toHaveClass("rotate-0");
    expect(triangle).not.toHaveClass("rotate-90");
    expect(screen.queryByText("Diagnostics panel")).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(triangle).toHaveClass("rotate-90");
    expect(screen.getByText("Diagnostics panel")).toBeInTheDocument();
  });

  it("keeps the triangle rotated when controlled open", () => {
    render(
      <AdvancedOptionsAccordion triggerLabel="Technical details" open>
        <p>Diagnostics panel</p>
      </AdvancedOptionsAccordion>,
    );

    expect(screen.getByText("▸")).toHaveClass("rotate-90");
    expect(screen.getByText("Diagnostics panel")).toBeInTheDocument();
  });
});
