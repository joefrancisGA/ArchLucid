import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotStartHereStrip } from "@/components/operator-home/PilotStartHereStrip";

describe("first-review cognitive load guard", () => {
  it("exposes exactly four primary steps before advanced lanes", () => {
    render(<PilotStartHereStrip />);

    expect(screen.getByTestId("pilot-start-here-strip")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByTestId("pilot-start-platform")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-start-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-start-run")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-start-proof")).toBeInTheDocument();
  });

  it("keeps Operate and V1.1 connectors secondary in helper copy", () => {
    render(<PilotStartHereStrip />);

    const copy = screen.getByTestId("pilot-start-here-strip").textContent ?? "";
    expect(copy).toContain("V1.1 connectors");
    expect(copy).toContain("optional");
  });
});
