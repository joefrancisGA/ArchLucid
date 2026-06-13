import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeverityTag } from "@/components/ui/severity-tag";

describe("SeverityTag", () => {
  it("normalizes API severity strings", () => {
    render(<SeverityTag severity="High" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders contract FindingSeverity enum names without unknown fallback (TB-328)", () => {
    render(<SeverityTag severity="Warning" />);
    expect(screen.getByText("Warning")).toBeInTheDocument();

    render(<SeverityTag severity="Error" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
