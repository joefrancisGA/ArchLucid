import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShellInFlightCancelAbandonClarity } from "@/components/shell/ShellInFlightCancelAbandonClarity";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";

describe("ShellInFlightCancelAbandonClarity (TB-2225)", () => {
  it("renders wait / leave / stop clarity from the SoT", () => {
    const clarity = buildCancelAbandonInFlightClarity();

    render(<ShellInFlightCancelAbandonClarity />);

    expect(screen.getByTestId("shell-in-flight-cancel-abandon-clarity")).toBeInTheDocument();
    expect(screen.getByText(clarity.heading)).toBeInTheDocument();

    for (const action of clarity.actions) {
      const row = screen.getByTestId(`shell-in-flight-cancel-abandon-clarity-${action.id}`);
      expect(row).toHaveTextContent(action.label);
      expect(row).toHaveTextContent(action.explanation);
    }
  });
});
