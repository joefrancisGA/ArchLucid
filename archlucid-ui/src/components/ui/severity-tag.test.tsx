import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeverityTag } from "@/components/ui/severity-tag";

describe("SeverityTag", () => {
  it("normalizes API severity strings", () => {
    render(<SeverityTag severity="High" />);
    const badge = screen.getByText("High");
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("pointer-events-none");
  });

  it("renders contract FindingSeverity enum names without unknown fallback (TB-328)", () => {
    render(<SeverityTag severity="Warning" />);
    expect(screen.getByText("Warning").tagName).toBe("SPAN");

    render(<SeverityTag severity="Error" />);
    expect(screen.getByText("Error").tagName).toBe("SPAN");
  });
});
